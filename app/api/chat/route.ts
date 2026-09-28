import Anthropic from '@anthropic-ai/sdk';
import { captureLeadTool, runCaptureLead } from '@/lib/capture-lead';
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, MAX_PAYLOAD_CHARS } from '@/lib/chat-config';
import { buildSystemPrompt } from '@/lib/chat-knowledge';
import { isTerminalStopReason, sseEvent, toAnthropicMessages } from '@/lib/chat-stream';
import { validateConversation } from '@/lib/chat-validation';
import { clientKeyFromHeaders, rateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Constructed on first use, not at module load. Importing this route in a test
 * must not require an API key to be present.
 */
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

/** Built once per instance. Must stay byte-stable for prompt caching to work. */
const SYSTEM_PROMPT = buildSystemPrompt();

/**
 * Spec section 10: distinguish retryable from non-retryable failures using the
 * SDK's typed classes, most specific first. Never string-match error messages,
 * and never let internal detail reach the browser.
 */
function describeFailure(error: unknown): { message: string; log: string } {
  if (error instanceof Anthropic.RateLimitError) {
    return { message: 'The assistant is busy right now — try again in a moment.', log: 'rate limited upstream' };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    // Operator error, not visitor error. Loud, because the endpoint is dead until it is fixed.
    return { message: 'The assistant is unavailable right now.', log: 'ANTHROPIC_API_KEY is missing or invalid' };
  }
  if (error instanceof Anthropic.APIError) {
    return { message: 'Something went wrong. Please try again.', log: `upstream API error ${error.status}` };
  }
  return { message: 'Something went wrong. Please try again.', log: 'unexpected failure' };
}

const json = (data: unknown, status: number, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export async function POST(request: Request): Promise<Response> {
  // 1. Kill switch — defaults off so merging this cannot expose a billable endpoint.
  if (process.env.CHAT_ENABLED !== 'true') {
    return json({ error: 'The assistant is unavailable right now.' }, 503);
  }

  // 2. Rate limit before anything expensive.
  const limit = rateLimiter.check(clientKeyFromHeaders(request.headers));
  if (!limit.ok) {
    return json({ error: 'Too many messages. Please wait a moment.' }, 429, {
      'Retry-After': String(limit.retryAfterSeconds ?? 60),
    });
  }

  // 3. Size, then shape.
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_CHARS) {
    return json({ error: 'That conversation is too large.' }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const validation = validateConversation(body);
  if (!validation.ok) {
    return json({ error: validation.error }, 400);
  }

  const encoder = new TextEncoder();
  // Review Focus 3: if the visitor closes the widget, stop consuming and stop billing.
  const abort = new AbortController();
  request.signal.addEventListener('abort', () => abort.abort());

  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(event, data)));

      try {
        const conversation = toAnthropicMessages(validation.messages);

        // One tool, so at most one round trip after the first. The bound stops a
        // pathological loop from billing without end.
        for (let iteration = 0; iteration < 3; iteration += 1) {
          const stream = getClient().messages.stream(
            {
              model: CHAT_MODEL,
              max_tokens: MAX_OUTPUT_TOKENS,
              system: [
                { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
              ],
              tools: [captureLeadTool],
              messages: conversation,
            },
            { signal: abort.signal },
          );

          stream.on('text', (delta) => send('delta', { text: delta }));

          const final = await stream.finalMessage();

          // Cheap signal that prompt caching is actually working (spec section 7).
          console.info('[chat] turn complete', {
            cacheRead: final.usage.cache_read_input_tokens,
            output: final.usage.output_tokens,
            stopReason: final.stop_reason,
          });

          if (isTerminalStopReason(final.stop_reason)) break;

          const toolUses = final.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
          );

          conversation.push({ role: 'assistant', content: final.content });
          conversation.push({
            role: 'user',
            content: await Promise.all(
              toolUses.map(async (block) => {
                const result = await runCaptureLead(block.input, validation.messages);
                if (result.ok) send('lead', { ok: true });
                return {
                  type: 'tool_result' as const,
                  tool_use_id: block.id,
                  content: JSON.stringify(result),
                  is_error: !result.ok,
                };
              }),
            ),
          });
        }

        send('done', {});
      } catch (error) {
        // A client disconnect surfaces here as an abort — not a failure worth logging.
        if (!abort.signal.aborted) {
          const { message, log } = describeFailure(error);
          console.error('[chat] stream failed:', log);
          send('error', { message });
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(responseBody, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
