import { MAX_MESSAGES, MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import type { ChatTurn } from '@/lib/enquiry-delivery';

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
