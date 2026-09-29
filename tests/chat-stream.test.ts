import { describe, it, expect } from 'vitest';
import { sseEvent, toAnthropicMessages } from '@/lib/chat-stream';

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
