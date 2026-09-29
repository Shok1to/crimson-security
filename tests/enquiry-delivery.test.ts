import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deliverEnquiry, type Enquiry } from '@/lib/enquiry-delivery';
import { REFERENCE_PATTERN } from '@/lib/enquiry-reference';

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

describe('the recipient', () => {
  const sentTo = async (): Promise<string[]> => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await deliverEnquiry(enquiry);
    return JSON.parse(String(fetchMock.mock.calls[0][1].body)).to;
  };

  /** Unset is the correct production setting, not a missing one. */
  it('defaults to the address published on the site', async () => {
    vi.stubEnv('RESEND_TO_EMAIL', '');
    await expect(sentTo()).resolves.toEqual(['info@crimsonsecurityinc.ca']);
  });

  it('uses RESEND_TO_EMAIL when it is set', async () => {
    vi.stubEnv('RESEND_TO_EMAIL', 'leads@example.com');
    await expect(sentTo()).resolves.toEqual(['leads@example.com']);
  });

  it('splits a comma-separated list so a team can all be notified', async () => {
    vi.stubEnv('RESEND_TO_EMAIL', 'one@example.com,two@example.com');
    await expect(sentTo()).resolves.toEqual(['one@example.com', 'two@example.com']);
  });

  it('tolerates the spacing a person actually types', async () => {
    vi.stubEnv('RESEND_TO_EMAIL', '  one@example.com ,  two@example.com  ,');
    await expect(sentTo()).resolves.toEqual(['one@example.com', 'two@example.com']);
  });

  /**
   * An empty or comma-only value must not produce an empty recipient list —
   * Resend would reject the send and the enquiry would be lost.
   */
  it.each([
    ['whitespace', '   '],
    ['commas alone', ',,,'],
  ])('falls back to the site address when the value is %s', async (_label, value) => {
    vi.stubEnv('RESEND_TO_EMAIL', value);
    await expect(sentTo()).resolves.toEqual(['info@crimsonsecurityinc.ca']);
  });
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

  it('returns the reference it generated when the transport accepts', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(deliverEnquiry(enquiry)).resolves.toMatch(REFERENCE_PATTERN);
  });

  /**
   * The code shown to the visitor has to be the one on the email, or quoting
   * it back achieves nothing.
   */
  it('puts that same reference at the front of the subject', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const reference = await deliverEnquiry(enquiry);
    const { subject } = JSON.parse(String(fetchMock.mock.calls[0][1].body));

    expect(subject.startsWith(`[${reference}] `)).toBe(true);
  });

  it('honours a reference supplied by the caller rather than replacing it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await expect(deliverEnquiry({ ...enquiry, reference: 'CS-ABC123' })).resolves.toBe('CS-ABC123');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).subject).toContain('[CS-ABC123]');
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
