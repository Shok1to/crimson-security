import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deliverEnquiry, type Enquiry } from '@/lib/enquiry-delivery';

const enquiry: Enquiry = {
  source: 'contact-form',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'We need a PCI assessment for Q4.',
};

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('deliverEnquiry', () => {
  it('throws when no API key is configured — never resolves silently', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    await expect(deliverEnquiry(enquiry)).rejects.toThrow(/not configured/i);
  });

  it('throws when the transport returns a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('nope', { status: 422 }));
    await expect(deliverEnquiry(enquiry)).rejects.toThrow(/422/);
  });

  it('throws when the transport rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('socket hang up'));
    await expect(deliverEnquiry(enquiry)).rejects.toThrow();
  });

  it('resolves when the transport accepts', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(deliverEnquiry(enquiry)).resolves.toBeUndefined();
  });

  it('sends the enquiry details in the request body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
    await deliverEnquiry(enquiry);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = String(init?.body);
    expect(body).toContain('Ada Lovelace');
    expect(body).toContain('ada@example.com');
    expect(body).toContain('PCI assessment');
  });

  /**
   * Called directly, not through either route, because the point is that this
   * module defends itself. Both callers strip CR/LF as well, but this is the
   * shared boundary every enquiry crosses and a third caller is specified, so
   * the invariant must not depend on each one remembering.
   */
  it('keeps CR/LF out of the subject even when the caller does not strip it', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
    await deliverEnquiry({
      ...enquiry,
      name: 'Ada\r\nBcc: attacker@example.com',
      company: 'Analytical\nEngines',
    });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const { subject } = JSON.parse(String(init?.body)) as { subject: string };
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toContain('Ada');
    expect(subject).toContain('Analytical');
  });

  it('includes the transcript for chat leads', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
    await deliverEnquiry({
      ...enquiry,
      source: 'chat',
      transcript: [
        { role: 'user', content: 'Do you do PCI?' },
        { role: 'assistant', content: 'Yes, compliance assessments cover PCI.' },
      ],
    });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(init?.body)).toContain('Do you do PCI?');
  });
});
