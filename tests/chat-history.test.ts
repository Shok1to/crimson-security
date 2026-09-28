import { describe, it, expect } from 'vitest';
import { settleTurn, trimForRequest, type Turn } from '@/lib/chat-history';
import { validateConversation } from '@/lib/chat-validation';
import { MAX_MESSAGES } from '@/lib/chat-config';

/** The property the whole module exists to guarantee. */
function alternatesFromUser(turns: Turn[]): boolean {
  return turns.every((t, i) => t.role === (i % 2 === 0 ? 'user' : 'assistant'));
}

describe('settleTurn', () => {
  it('keeps both turns when an answer arrived', () => {
    expect(settleTurn([], 'hi', 'hello')).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);
  });

  // Spec section 10: a stream that breaks mid-answer leaves the partial text on
  // screen rather than vanishing. The pair still alternates, so it is safe.
  it('keeps a partial answer rather than discarding the exchange', () => {
    const settled = settleTurn([], 'hi', 'Crimson offers pen');
    expect(settled).toHaveLength(2);
    expect(settled[1].content).toBe('Crimson offers pen');
  });

  // The C1 regression: the old code kept the visitor's turn on failure, so the
  // next send posted two consecutive user turns and the server 400'd.
  it('drops the visitor turn as well when no answer arrived', () => {
    const before: Turn[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    expect(settleTurn(before, 'and PCI?', '')).toEqual(before);
    expect(settleTurn(before, 'and PCI?', '')).toBe(before);
  });

  it('leaves an empty conversation empty when the very first turn fails', () => {
    expect(settleTurn([], 'hi', '')).toEqual([]);
  });
});

describe('trimForRequest', () => {
  const build = (n: number): Turn[] =>
    Array.from({ length: n }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `m${i}`,
    }));

  it('leaves a conversation within the cap untouched', () => {
    const turns = build(MAX_MESSAGES);
    expect(trimForRequest(turns)).toBe(turns);
  });

  it('brings an over-long conversation back within the cap', () => {
    expect(trimForRequest(build(MAX_MESSAGES + 1)).length).toBeLessThanOrEqual(MAX_MESSAGES);
    expect(trimForRequest(build(MAX_MESSAGES + 9)).length).toBeLessThanOrEqual(MAX_MESSAGES);
  });

  it('drops only whole exchanges, so the result still starts with the visitor', () => {
    const trimmed = trimForRequest(build(MAX_MESSAGES + 5));
    expect(alternatesFromUser(trimmed)).toBe(true);
  });

  it('keeps the newest turns, including the question just asked', () => {
    const turns = build(MAX_MESSAGES + 3);
    const trimmed = trimForRequest(turns);
    expect(trimmed[trimmed.length - 1]).toBe(turns[turns.length - 1]);
  });

  // I8: the thirteenth exchange used to be a dead end. It must now be accepted.
  it('produces a payload the server accepts well past the message cap', () => {
    for (let exchanges = 1; exchanges <= 30; exchanges += 1) {
      const turns = build(exchanges * 2 - 1); // ends on the visitor's question
      const result = validateConversation({ messages: trimForRequest(turns) });
      expect(result.ok, `exchange ${exchanges}`).toBe(true);
    }
  });
});

/**
 * The invariant, exercised over every combination of turn outcomes rather than
 * the handful of scenarios that happened to be reported. A "failure" here
 * stands for any non-success exit — 503 kill switch, 429, abort, transient
 * upstream error, or a completed stream with no text: the widget funnels all of
 * them through the same `answer === ''` settle path.
 */
describe('conversation invariant across any sequence of outcomes', () => {
  function replay(outcomes: boolean[]) {
    let history: Turn[] = [];
    const payloads: Turn[][] = [];

    outcomes.forEach((succeeded, i) => {
      const question = `question ${i}`;
      const next: Turn[] = [...history, { role: 'user', content: question }];
      payloads.push(trimForRequest(next));
      history = settleTurn(history, question, succeeded ? `answer ${i}` : '');
    });

    return { history, payloads };
  }

  // 2^6 sequences: every interleaving of success and failure up to six turns.
  const sequences: boolean[][] = [];
  for (let length = 1; length <= 6; length += 1) {
    for (let mask = 0; mask < 1 << length; mask += 1) {
      sequences.push(Array.from({ length }, (_, bit) => Boolean(mask & (1 << bit))));
    }
  }

  it('never leaves a history that does not alternate from the visitor', () => {
    for (const outcomes of sequences) {
      const { history } = replay(outcomes);
      expect(alternatesFromUser(history), JSON.stringify(outcomes)).toBe(true);
      if (history.length > 0) expect(history[0].role).toBe('user');
    }
  });

  it('never leaves a history ending on the visitor, so the next send cannot double up', () => {
    for (const outcomes of sequences) {
      const { history } = replay(outcomes);
      if (history.length > 0) expect(history[history.length - 1].role).toBe('assistant');
    }
  });

  it('posts a payload the server validator accepts on every single turn', () => {
    for (const outcomes of sequences) {
      for (const payload of replay(outcomes).payloads) {
        const result = validateConversation({ messages: payload });
        expect(result.ok, `${JSON.stringify(outcomes)} -> ${JSON.stringify(payload)}`).toBe(true);
      }
    }
  });

  // The reported reproduction, stated directly: fail once, then send again.
  it('accepts the send that follows a failed turn', () => {
    const { payloads } = replay([true, false, false]);
    const last = payloads[payloads.length - 1];
    expect(validateConversation({ messages: last }).ok).toBe(true);
    expect(last.filter((t) => t.role === 'user')).toHaveLength(2);
  });

  it('never leaves an empty turn in the history for the validator to reject', () => {
    for (const outcomes of sequences) {
      for (const turn of replay(outcomes).history) {
        expect(turn.content.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
