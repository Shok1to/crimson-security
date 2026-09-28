import { MAX_MESSAGES, MAX_PAYLOAD_CHARS, MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import type { ChatTurn } from '@/lib/enquiry-delivery';
import { clientKeyFromHeaders, rateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // Streaming is added in Task 7.
  return json({ ok: true }, 200);
}
