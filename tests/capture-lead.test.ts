import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/enquiry-delivery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/enquiry-delivery')>()),
  deliverEnquiry: vi.fn(),
}));

import { runCaptureLead, captureLeadTool, createLeadBudget } from '@/lib/capture-lead';
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

  // A newline reaching the email subject is header-injection shaped.
  it('strips CR/LF from the name and company', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    await runCaptureLead(
      { ...valid, name: 'Ada\r\nBcc: attacker@example.com', company: 'Ada\nCorp' },
      transcript,
    );
    const delivered = vi.mocked(deliverEnquiry).mock.calls[0][0];
    expect(delivered.name).not.toMatch(/[\r\n]/);
    expect(delivered.company).not.toMatch(/[\r\n]/);
  });
});

/**
 * I3: parallel tool use plus a 3-iteration tool loop is a path to many emails
 * from one unauthenticated request, all aimed at Crimson's own mailbox.
 */
describe('createLeadBudget', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    summary: 'Wants a PCI assessment before Q4.',
  };

  it('runs the first capture_lead', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();
    await expect(budget.run(valid, transcript)).resolves.toEqual({ ok: true });
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });

  it('refuses every later capture_lead in the same request without delivering', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();
    await budget.run(valid, transcript);

    for (let i = 0; i < 9; i += 1) {
      const result = await budget.run(valid, transcript);
      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    }
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });

  it('sends at most one email even when the tool uses are run concurrently', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => budget.run(valid, transcript)),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });

  it('keeps budgets independent between requests', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    await createLeadBudget().run(valid, transcript);
    await expect(createLeadBudget().run(valid, transcript)).resolves.toEqual({ ok: true });
    expect(deliverEnquiry).toHaveBeenCalledTimes(2);
  });

  // The cap must not become an exception — the model has to be able to read it.
  it('reports the refusal as a recoverable result, never a throw', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();
    await budget.run(valid, transcript);
    await expect(budget.run(valid, transcript)).resolves.toMatchObject({ ok: false });
  });
});
