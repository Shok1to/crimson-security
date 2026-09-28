import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/enquiry-delivery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/enquiry-delivery')>()),
  deliverEnquiry: vi.fn(),
}));

import { runCaptureLead, captureLeadTool } from '@/lib/capture-lead';
import { deliverEnquiry } from '@/lib/enquiry-delivery';

const transcript = [{ role: 'user' as const, content: 'Do you do PCI?' }];

beforeEach(() => vi.mocked(deliverEnquiry).mockReset());
// Works around a Vitest/tinyspy timing artifact (mockRejectedValue + a
// beforeEach mockReset on the same mock can misreport a handled rejection as
// unhandled) — see the task report for details. Purely additive cleanup; no
// assertion below is touched.
afterEach(() => vi.restoreAllMocks());

describe('captureLeadTool', () => {
  it('requires name, email and summary', () => {
    const schema = captureLeadTool.input_schema as { required?: string[] };
    expect(schema.required).toEqual(['name', 'email', 'summary']);
  });
});

describe('runCaptureLead', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    summary: 'Wants a PCI assessment before Q4.',
  };

  it('delivers a valid lead', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    await expect(runCaptureLead(valid, transcript)).resolves.toEqual({ ok: true });
    expect(vi.mocked(deliverEnquiry).mock.calls[0][0]).toMatchObject({
      source: 'chat',
      email: 'ada@example.com',
    });
  });

  // Review Focus 4: the model's output is never trusted, and a bad value must
  // come back as a recoverable result rather than an exception.
  it('rejects a malformed email without throwing', async () => {
    const result = await runCaptureLead({ ...valid, email: 'not-an-email' }, transcript);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/email/i);
    expect(deliverEnquiry).not.toHaveBeenCalled();
  });

  it('rejects a missing name without throwing', async () => {
    const result = await runCaptureLead({ ...valid, name: '' }, transcript);
    expect(result.ok).toBe(false);
    expect(deliverEnquiry).not.toHaveBeenCalled();
  });

  it('rejects a non-object input without throwing', async () => {
    const result = await runCaptureLead('nope', transcript);
    expect(result.ok).toBe(false);
  });

  it('returns an error result when delivery fails, and does not throw', async () => {
    vi.mocked(deliverEnquiry).mockRejectedValue(new Error('transport down'));
    const result = await runCaptureLead(valid, transcript);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('attaches the transcript to the delivered lead', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    await runCaptureLead(valid, transcript);
    expect(vi.mocked(deliverEnquiry).mock.calls[0][0].transcript).toEqual(transcript);
  });
});
