import { describe, it, expect, vi, afterEach } from 'vitest';
import { CONSENT_STATEMENT, deliverLead, validateLead } from '@/lib/chat-lead';
import { MAX_LEAD_CONTACT_CHARS, MAX_LEAD_NAME_CHARS } from '@/lib/chat-config';
import { REFERENCE_PATTERN } from '@/lib/enquiry-reference';
import { sseEvent } from '@/lib/chat-stream';

/** The shape the gate posts when everything is filled in correctly. */
const valid = { name: 'Dana Okafor', contact: 'dana@example.com', consent: true };

describe('validateLead', () => {
  it('accepts a name with an email address and consent', () => {
    const result = validateLead(valid);
    expect(result).toEqual({
      ok: true,
      lead: { name: 'Dana Okafor', email: 'dana@example.com', phone: '' },
    });
  });

  /**
   * One field takes either, so which one the visitor gave is inferred rather
   * than declared. An email lands in `email` and a phone in `phone`, because
   * deliverEnquiry uses the address for reply_to and must not be handed a
   * phone number there.
   */
  describe('the single contact field', () => {
    it('routes a phone number to phone and leaves email empty', () => {
      const result = validateLead({ ...valid, contact: '+1 (416) 555-0134' });
      expect(result).toEqual({
        ok: true,
        lead: { name: 'Dana Okafor', email: '', phone: '+1 (416) 555-0134' },
      });
    });

    it.each([
      ['a bare NANP number', '4165550134'],
      ['dashes and brackets', '(416) 555-0134'],
      ['dots', '416.555.0134'],
      ['an extension', '416-555-0134 x22'],
      ['a country code', '+44 20 7946 0958'],
    ])('accepts %s', (_label, contact) => {
      const result = validateLead({ ...valid, contact });
      expect(result.ok).toBe(true);
    });

    it.each([
      ['too few digits to reach anyone', '5550134'],
      ['more digits than E.164 allows', '12345678901234567'],
      ['a malformed address', 'dana@example'],
      ['prose', 'call me sometime'],
      ['an address with a space in it', 'dana @example.com'],
    ])('rejects %s', (_label, contact) => {
      const result = validateLead({ ...valid, contact });
      expect(result).toMatchObject({ ok: false, field: 'contact' });
    });

    it('names both accepted forms in the error, since it accepts both', () => {
      const result = validateLead({ ...valid, contact: 'nonsense' });
      expect(result).toMatchObject({ error: expect.stringMatching(/email address or a phone/i) });
    });
  });

  describe('consent', () => {
    /**
     * Consent is the lawful basis for contacting them, so only a literal true
     * counts. A truthy string is what a hand-rolled client would send, and it
     * must not be mistaken for someone having ticked the box.
     */
    it.each([
      ['absent', undefined],
      ['false', false],
      ['the string "true"', 'true'],
      ['the number 1', 1],
    ])('rejects %s', (_label, consent) => {
      const result = validateLead({ ...valid, consent });
      expect(result).toMatchObject({ ok: false, field: 'consent' });
    });

    it('is checked after the contact details, so the first fix asked for is theirs', () => {
      // Everything wrong at once: the visitor is told about the empty name
      // first rather than being sent back three times.
      const result = validateLead({ name: '', contact: '', consent: false });
      expect(result).toMatchObject({ field: 'name' });
    });
  });

  describe('sanitising', () => {
    it('trims surrounding whitespace', () => {
      const result = validateLead({ ...valid, name: '  Dana Okafor  ' });
      expect(result).toMatchObject({ lead: { name: 'Dana Okafor' } });
    });

    /** Both values reach an email we send; a newline has no business in one. */
    it('folds CR/LF out of the name', () => {
      const result = validateLead({ ...valid, name: 'Dana\r\nBcc: someone@evil.test' });
      expect(result).toMatchObject({
        lead: { name: expect.not.stringContaining('\n') },
      });
    });

    it('caps the name and contact at their configured lengths', () => {
      const long = validateLead({
        name: 'a'.repeat(MAX_LEAD_NAME_CHARS + 50),
        contact: `${'b'.repeat(MAX_LEAD_CONTACT_CHARS)}@example.com`,
        consent: true,
      });
      // The contact is truncated mid-address, so it stops being a valid one —
      // rejected rather than silently delivered to a different address.
      expect(long).toMatchObject({ ok: false, field: 'contact' });

      const okName = validateLead({ ...valid, name: 'a'.repeat(MAX_LEAD_NAME_CHARS + 50) });
      expect(okName).toMatchObject({ lead: { name: 'a'.repeat(MAX_LEAD_NAME_CHARS) } });
    });

    it.each([
      ['null', null],
      ['a string', 'Dana'],
      ['a number', 7],
    ])('rejects %s rather than throwing', (_label, input) => {
      expect(validateLead(input)).toMatchObject({ ok: false });
    });
  });
});

describe('deliverLead', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const lead = { name: 'Dana Okafor', email: 'dana@example.com', phone: '' };
  const at = new Date('2026-09-29T12:00:00.000Z');

  it('sends the question as the enquiry body and records the consent given', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const result = await deliverLead(lead, 'Do you assess against PCI?', at);

    expect(result).toMatchObject({ ok: true, reference: expect.any(String) });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Do you assess against PCI?');
    // The wording the visitor actually agreed to, plus when — a bare
    // "consent: true" is not evidence of anything.
    expect(body.text).toContain(CONSENT_STATEMENT);
    expect(body.text).toContain(at.toISOString());
    expect(body.reply_to).toBe('dana@example.com');
  });

  it('omits reply_to entirely for a phone-only enquiry', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await deliverLead({ name: 'Dana', email: '', phone: '416-555-0134' }, 'Hello?', at);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    // Resend rejects an empty reply_to, so the key must be absent, not blank.
    expect(body).not.toHaveProperty('reply_to');
    expect(body.text).toContain('Phone: 416-555-0134');
    // Stated rather than omitted: a missing line reads as an oversight, while
    // "not given" tells the team immediately that replying means phoning.
    expect(body.text).toContain('Email: not given');
    expect(body.text).not.toContain('@');
  });

  /**
   * The route emits this result verbatim as the `lead` event, and the widget
   * shows the reference to the visitor. This pins that contract: the two sides
   * are wired through a plain object, so nothing in the type system would
   * catch the reference being dropped on the way out.
   */
  it('produces a lead event the widget can read the reference from', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const result = await deliverLead(lead, 'Do you assess against PCI?', at);
    const frame = sseEvent('lead', result);

    expect(frame.startsWith('event: lead\n')).toBe(true);

    const payload = JSON.parse(frame.match(/^data: (.+)$/m)![1]);
    expect(payload.ok).toBe(true);
    expect(payload.reference).toMatch(REFERENCE_PATTERN);
  });

  it('carries no reference when delivery failed, so nothing false is shown', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const payload = JSON.parse(
      sseEvent('lead', await deliverLead(lead, 'Hello?', at)).match(/^data: (.+)$/m)![1],
    );
    expect(payload.ok).toBe(false);
    expect(payload.reference).toBeUndefined();
  });

  /**
   * The visitor is waiting on an answer. A delivery failure must cost them the
   * enquiry, not the reply — so this reports rather than throws, and the route
   * turns the report into something the visitor can act on.
   */
  it('reports failure instead of throwing when delivery is unconfigured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(deliverLead(lead, 'Hello?', at)).resolves.toEqual({ ok: false });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('reports failure when the provider rejects the send', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(deliverLead(lead, 'Hello?', at)).resolves.toEqual({ ok: false });
    error.mockRestore();
  });
});
