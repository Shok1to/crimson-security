import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/enquiry-delivery', () => ({ deliverEnquiry: vi.fn() }));

import { POST } from '@/app/api/contact/route';
import { RATE_LIMIT_MAX } from '@/lib/chat-config';
import { deliverEnquiry } from '@/lib/enquiry-delivery';

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }));

const valid = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'We need a PCI assessment for Q4.',
};

beforeEach(() => vi.mocked(deliverEnquiry).mockReset());
afterEach(() => vi.restoreAllMocks());

describe('POST /api/contact', () => {
  it('delivers a valid enquiry and returns ok', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue('CS-T3ST01');
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(deliverEnquiry).toHaveBeenCalledOnce();
    expect(vi.mocked(deliverEnquiry).mock.calls[0][0]).toMatchObject({
      source: 'contact-form',
      name: 'Ada',
      email: 'ada@example.com',
    });
  });

  // The whole point of issue #1: a delivery failure must not read as success.
  it('returns 500 when delivery throws, and does not claim success', async () => {
    vi.mocked(deliverEnquiry).mockRejectedValue(new Error('transport down'));
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect(await res.json()).not.toMatchObject({ ok: true });
  });

  it('never calls delivery for an invalid payload', async () => {
    const res = await post({ name: '', email: 'nope', message: 'short' });
    expect(res.status).toBe(422);
    expect(deliverEnquiry).not.toHaveBeenCalled();
  });

  it('never calls delivery when the honeypot is filled', async () => {
    const res = await post({ ...valid, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(deliverEnquiry).not.toHaveBeenCalled();
  });

  // A newline reaching the email subject is header-injection shaped. Resend
  // takes JSON so it cannot actually inject, but the value is still cleaned.
  it('strips CR/LF from the name before it reaches delivery', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue('CS-T3ST01');
    await post({ ...valid, name: 'Ada\r\nBcc: attacker@example.com', company: 'Ada\nCorp' });
    const delivered = vi.mocked(deliverEnquiry).mock.calls[0][0];
    expect(delivered.name).not.toMatch(/[\r\n]/);
    expect(delivered.company).not.toMatch(/[\r\n]/);
  });

  // I2: this route genuinely sends email now, so it needs the same bound the
  // chat route has. It shares the same mailbox and the same Resend quota.
  it('returns 429 with Retry-After once the rate limit is exceeded', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue('CS-T3ST01');
    const ip = { 'x-forwarded-for': '198.51.100.77' };
    // Warm the window with invalid payloads: the limiter runs before body
    // parsing, so each counts without ever reaching delivery.
    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) await post({ name: '' }, ip);
    const res = await post(valid, ip);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(deliverEnquiry).not.toHaveBeenCalled();
  });
});
