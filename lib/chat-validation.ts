import { MAX_MESSAGES, MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import type { ChatTurn } from '@/lib/enquiry-delivery';

type Validation =
  | { ok: true; messages: ChatTurn[] }
  | { ok: false; error: string };

/**
 * Validates the conversation the client echoes back on every turn.
 *
 * Lives here rather than in the route because Next.js permits only specific
 * exports from a route module, so the route can export nothing but POST.
 *
 * The Messages API rejects a history that does not alternate from `user`, and
 * our own 400 is cheaper than a round trip to learn that.
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
    // Defence in depth: an empty or whitespace-only turn (e.g. a client bug
    // that resends a stale placeholder) would otherwise pass this guard and
    // fail upstream against the Messages API instead, which is confusing to
    // diagnose. Reject it here with an honest message.
    if (turn.content.trim().length === 0) {
      return { ok: false, error: 'Every message must have content.' };
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
