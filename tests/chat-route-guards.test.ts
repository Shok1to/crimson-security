import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateConversation } from '@/lib/chat-validation';
import { MAX_MESSAGES, MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';

const turn = (role: 'user' | 'assistant', content: string) => ({ role, content });

beforeEach(() => vi.stubEnv('CHAT_ENABLED', 'true'));
afterEach(() => vi.unstubAllEnvs());

describe('validateConversation', () => {
  it('accepts a single user turn', () => {
    expect(validateConversation({ messages: [turn('user', 'Do you do PCI?')] }).ok).toBe(true);
  });

  it('accepts an alternating conversation ending on the user', () => {
    const result = validateConversation({
      messages: [turn('user', 'hi'), turn('assistant', 'hello'), turn('user', 'do you do PCI?')],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-array messages field', () => {
    expect(validateConversation({ messages: 'hello' }).ok).toBe(false);
  });

  it('rejects an empty conversation', () => {
    expect(validateConversation({ messages: [] }).ok).toBe(false);
  });

  it('rejects a conversation that does not start with the user', () => {
    expect(validateConversation({ messages: [turn('assistant', 'hi')] }).ok).toBe(false);
  });

  it('rejects a conversation that does not end with the user', () => {
    const result = validateConversation({ messages: [turn('user', 'hi'), turn('assistant', 'hello')] });
    expect(result.ok).toBe(false);
  });

  it('rejects consecutive same-role turns', () => {
    const result = validateConversation({ messages: [turn('user', 'hi'), turn('user', 'again')] });
    expect(result.ok).toBe(false);
  });

  it('rejects a user message over the character cap', () => {
    const result = validateConversation({ messages: [turn('user', 'x'.repeat(MAX_USER_MESSAGE_CHARS + 1))] });
    expect(result.ok).toBe(false);
  });

  it('rejects a conversation over the message cap', () => {
    const messages = Array.from({ length: MAX_MESSAGES + 1 }, (_, i) =>
      turn(i % 2 === 0 ? 'user' : 'assistant', 'x'),
    );
    expect(validateConversation({ messages }).ok).toBe(false);
  });

  it('rejects a turn whose content is not a string', () => {
    expect(validateConversation({ messages: [{ role: 'user', content: { a: 1 } }] }).ok).toBe(false);
  });

  it('rejects a conversation containing an empty turn (e.g. a stale assistant placeholder)', () => {
    const result = validateConversation({
      messages: [turn('user', 'hi'), turn('assistant', ''), turn('user', 'again')],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a conversation containing a whitespace-only turn', () => {
    const result = validateConversation({
      messages: [turn('user', 'hi'), turn('assistant', '   '), turn('user', 'again')],
    });
    expect(result.ok).toBe(false);
  });
});

import { POST } from '@/app/api/chat/route';
import { MAX_PAYLOAD_CHARS, RATE_LIMIT_MAX } from '@/lib/chat-config';

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

const oneTurn = { messages: [turn('user', 'Do you do PCI?')] };

describe('POST /api/chat guards', () => {
  it('returns 503 when CHAT_ENABLED is unset', async () => {
    vi.stubEnv('CHAT_ENABLED', '');
    expect((await post(oneTurn, { 'x-forwarded-for': '198.51.100.1' })).status).toBe(503);
  });

  it('returns 503 when CHAT_ENABLED is any value other than "true"', async () => {
    vi.stubEnv('CHAT_ENABLED', '1');
    expect((await post(oneTurn, { 'x-forwarded-for': '198.51.100.2' })).status).toBe(503);
  });

  it('returns 429 with Retry-After once the rate limit is exceeded', async () => {
    const ip = { 'x-forwarded-for': '198.51.100.3' };
    // Warm the window with MALFORMED bodies on purpose. The rate limiter runs
    // before JSON parsing, so each of these counts against the window and then
    // returns 400 — without ever reaching the model. Using a *valid* body here
    // would send 15 live requests to Anthropic once Task 7 lands.
    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) await post('{not json', ip);
    const res = await post('{not json', ip);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('returns 400 for a payload over the size cap', async () => {
    const huge = JSON.stringify({ messages: [turn('user', 'x')] }) + ' '.repeat(MAX_PAYLOAD_CHARS);
    expect((await post(huge, { 'x-forwarded-for': '198.51.100.4' })).status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    expect((await post('{not json', { 'x-forwarded-for': '198.51.100.5' })).status).toBe(400);
  });

  it('returns 400 for a structurally invalid conversation', async () => {
    const res = await post({ messages: [turn('assistant', 'hi')] }, { 'x-forwarded-for': '198.51.100.6' });
    expect(res.status).toBe(400);
  });
});
