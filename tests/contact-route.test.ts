import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/enquiry-delivery', () => ({ deliverEnquiry: vi.fn() }));

import { POST } from '@/app/api/contact/route';
import { deliverEnquiry } from '@/lib/enquiry-delivery';

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
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
});
