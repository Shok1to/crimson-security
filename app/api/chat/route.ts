import Anthropic from '@anthropic-ai/sdk';
import { captureLeadTool, createLeadBudget } from '@/lib/capture-lead';
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, MAX_PAYLOAD_CHARS } from '@/lib/chat-config';
import { describeFailure } from '@/lib/chat-failure';
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
  const limit = await rateLimiter.check(clientKeyFromHeaders(request.headers));
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
        // One per request, so the 3-iteration loop below cannot multiply lead
        // emails and neither can parallel tool use within a single message.
        const leads = createLeadBudget();

        // One tool, so at most one round trip after the first. The bound stops a
        // pathological loop from billing without end.
        for (let iteration = 0; iteration < 3; iteration += 1) {
          const stream = getClient().messages.stream(
            {
              model: CHAT_MODEL,
              max_tokens: MAX_OUTPUT_TOKENS,
              // This cache_control marker is INERT on this model today, and
              // deliberately kept. Haiku 4.5's minimum cacheable prefix is
              // 4096 tokens; SYSTEM_PROMPT measures ~2,200 — barely half — so
              // nothing is ever cached. Confirmed live: cache_read_input_tokens
              // was 0 on every request of the first real API pass. The failure
              // is silent by design, which is why it took a live run to see.
              // Retained because it costs nothing and starts working the moment
              // the prompt grows past 4096 or the model changes. See spec §7.
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

          // cacheRead is expected to be 0 on this model — see the note on
          // cache_control above. It is still logged, because a non-zero value
          // is exactly the signal that the prompt has grown past Haiku 4.5's
          // 4096-token threshold and caching has started working.
          console.info('[chat] turn complete', {
            cacheRead: final.usage.cache_read_input_tokens,
            output: final.usage.output_tokens,
            stopReason: final.stop_reason,
          });

          if (isTerminalStopReason(final.stop_reason)) break;

          const toolUses = final.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
          );

          // Sequential on purpose: one lead may be delivered per request, so
          // there is nothing to gain from running these concurrently and the
          // budget's bound is easier to see this way.
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of toolUses) {
            const result = await leads.run(block.input, validation.messages);
            if (result.ok) send('lead', { ok: true });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
              is_error: !result.ok,
            });
          }

          conversation.push({ role: 'assistant', content: final.content });
          conversation.push({ role: 'user', content: toolResults });
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
        // After a consumer-initiated cancel() the stream is already closed and
        // this throws TypeError: Invalid state. Nothing is left to do at that
        // point, so swallow it rather than letting it surface as noise.
        try {
          controller.close();
        } catch {
          /* already closed by cancel() */
        }
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
