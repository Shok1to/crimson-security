import { MAX_MESSAGES } from '@/lib/chat-config';

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The conversation the widget holds in state is the conversation it posts back
 * on the next turn, so it has one invariant the server enforces and the widget
 * must never break:
 *
 *   the turns alternate, and a non-empty conversation starts with `user`.
 *
 * Breaking it is not a cosmetic bug. `validateConversation` rejects a history
 * that ends on `user` followed by another `user`, so a single mishandled
 * failure poisons every later send with an internal validator string until the
 * visitor reloads the page. These two functions are the whole state machine,
 * kept pure and out of the component so the invariant can be tested directly.
 */

/**
 * Settles one exchange, whatever happened during it.
 *
 * `before` is the conversation as it stood when the visitor pressed send —
 * already alternating and already ending on an assistant turn (or empty).
 *
 * - Some answer arrived (complete, or partial because the stream broke or the
 *   visitor closed the panel): keep BOTH turns. The pair preserves alternation,
 *   and spec section 10 requires a partial answer to stay on screen rather than
 *   vanish.
 * - No answer arrived at all: drop BOTH turns and return `before` unchanged.
 *   Keeping the question alone would leave the conversation ending on `user`,
 *   which is exactly the corruption above. The caller is responsible for
 *   putting the question back in the draft input so it is not lost.
 */
export function settleTurn(before: Turn[], question: string, answer: string): Turn[] {
  if (!answer) return before;
  return [
    ...before,
    { role: 'user', content: question },
    { role: 'assistant', content: answer },
  ];
}

/**
 * Trims the payload — not the transcript on screen — to the server's cap.
 *
 * Without this, the thirteenth exchange gets "Conversation is too long." and
 * the visitor has no way forward, which is worst for the engaged visitor most
 * likely to convert. Only whole exchanges go, from the oldest end: dropping an
 * EVEN number of turns preserves both the alternation and the leading `user`
 * role, so the trimmed payload still satisfies the server's validator.
 */
export function trimForRequest(turns: Turn[], max: number = MAX_MESSAGES): Turn[] {
  if (turns.length <= max) return turns;
  let drop = turns.length - max;
  if (drop % 2 !== 0) drop += 1;
  return turns.slice(drop);
}
