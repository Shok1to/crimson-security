import { MAX_MESSAGES } from '@/lib/chat-config';

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * THE INVARIANT: turns alternate, and a non-empty conversation starts with
 * `user`. The widget's state is the payload it posts next, so one mishandled
 * failure breaks every later send until reload. Pure, so it can be tested.
 */

/**
 * Settles one exchange. Any answer keeps both turns, partial included (spec
 * section 10). No answer drops both, since the question alone would end on
 * `user`; the caller restores it to the draft. Trimmed because the validator
 * rejects a whitespace-only turn; the answer is stored as produced.
 */
export function settleTurn(before: Turn[], question: string, answer: string): Turn[] {
  if (!answer.trim()) return before;
  return [
    ...before,
    { role: 'user', content: question },
    { role: 'assistant', content: answer },
  ];
}

/**
 * Trims the payload, not the transcript on screen. Dropping an EVEN number of
 * turns from the oldest end is what preserves the invariant.
 */
export function trimForRequest(turns: Turn[], max: number = MAX_MESSAGES): Turn[] {
  if (turns.length <= max) return turns;
  let drop = turns.length - max;
  if (drop % 2 !== 0) drop += 1;
  return turns.slice(drop);
}
