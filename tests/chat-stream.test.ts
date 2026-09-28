import { describe, it, expect } from 'vitest';
import { sseEvent, toAnthropicMessages, isTerminalStopReason } from '@/lib/chat-stream';

describe('sseEvent', () => {
  it('formats a named event with JSON data and a blank-line terminator', () => {
    expect(sseEvent('delta', { text: 'hi' })).toBe('event: delta\ndata: {"text":"hi"}\n\n');
  });

  it('escapes newlines inside the payload so the frame is not split', () => {
    const frame = sseEvent('delta', { text: 'line one\nline two' });
    expect(frame.split('\n\n')).toHaveLength(2);
    expect(frame).toContain('\\n');
  });
});

describe('toAnthropicMessages', () => {
  it('maps chat turns to Messages API params', () => {
    expect(
      toAnthropicMessages([
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
      ]),
    ).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);
  });
});

describe('isTerminalStopReason', () => {
  it('treats end_turn as terminal', () => {
    expect(isTerminalStopReason('end_turn')).toBe(true);
  });

  // Review Focus 5: a truncated answer must end the turn, not fall into the
  // tool_use branch or spin the loop.
  it('treats max_tokens as terminal', () => {
    expect(isTerminalStopReason('max_tokens')).toBe(true);
  });

  it('does not treat tool_use as terminal', () => {
    expect(isTerminalStopReason('tool_use')).toBe(false);
  });

  it('treats an unknown stop reason as terminal rather than looping', () => {
    expect(isTerminalStopReason('something_new')).toBe(true);
  });
});
