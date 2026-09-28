import Anthropic from '@anthropic-ai/sdk';
import { CHAT_MODEL, MAX_MESSAGES, MAX_OUTPUT_TOKENS, MAX_PAYLOAD_CHARS, MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import { buildSystemPrompt } from '@/lib/chat-knowledge';
import { isTerminalStopReason, sseEvent, toAnthropicMessages } from '@/lib/chat-stream';
import type { ChatTurn } from '@/lib/enquiry-delivery';
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

type Validation =
  | { ok: true; messages: ChatTurn[] }
  | { ok: false; error: string };

/**
 * Validates the conversation the client echoes back on every turn.
 *
 * The role-sequence rules are not pedantry: the Messages API rejects a history
 * that does not alternate from `user`, and we would rather return our own 400
 * than pay for a round trip to learn that.
 */
export function validateConversation(body: unknown): Validation {
  const messages = (body as { messages?: unknown })?.messages;

  if (!Array.isArray(messages)) return { ok: false, error: 'Expected a list of messages.' };
  if (messages.length === 0) return { ok: false, error: 'Conversation is empty.' };
  if (messages.length > MAX_MESSAGES) return { ok: false, error: 'Conversation is too long.' };

  const turns: ChatTurn[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const turn = messages[i] as { role?: unknown; content?: unknown };
    const expected = i % 2 === 0 ? 'user' : 'assistant';

    if (turn?.role !== expected) {
      return { ok: false, error: 'Conversation turns must alternate, starting with the visitor.' };
    }
    if (typeof turn.content !== 'string') {
      return { ok: false, error: 'Every message must be text.' };
    }
    if (expected === 'user' && turn.content.length > MAX_USER_MESSAGE_CHARS) {
      return { ok: false, error: 'That message is too long.' };
    }
    turns.push({ role: expected, content: turn.content });
  }

  if (turns[turns.length - 1].role !== 'user') {
    return { ok: false, error: 'The last message must be from the visitor.' };
  }

  return { ok: true, messages: turns };
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
        const stream = getClient().messages.stream(
          {
            model: CHAT_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: [
              { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
            ],
            messages: toAnthropicMessages(validation.messages),
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

        if (!isTerminalStopReason(final.stop_reason)) {
          // Tool handling arrives in Task 8.
          send('error', { message: 'Unsupported response.' });
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
