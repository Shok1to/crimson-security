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
 *
 * The cap counts DELIVERIES, not attempts. An attempt that fails validation
 * sends no mail, so it is not part of the risk being bounded — and counting it
 * would break the retry the tool's recoverable-error contract exists to allow.
 */
describe('createLeadBudget', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    summary: 'Wants a PCI assessment before Q4.',
  };
  const badEmail = { ...valid, email: 'not-an-email' };

  it('runs the first capture_lead', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();
    await expect(budget.run(valid, transcript)).resolves.toEqual({ ok: true });
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });

  it('refuses every later capture_lead once one has been delivered', async () => {
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

  // Half one of the deliveries-not-attempts rule: a validation failure sends no
  // mail, so it must not consume the budget. runCaptureLead hands the model
  // "ask the visitor to confirm it" precisely so it can retry in this request.
  it('lets a failed attempt be retried successfully in the same request', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();

    const rejected = await budget.run(badEmail, transcript);
    expect(rejected.ok).toBe(false);
    expect(rejected.error).toMatch(/email/i);
    expect(deliverEnquiry).not.toHaveBeenCalled();

    await expect(budget.run(valid, transcript)).resolves.toEqual({ ok: true });
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });

  it('does not consume the budget when delivery itself fails', async () => {
    vi.mocked(deliverEnquiry).mockRejectedValueOnce(new Error('transport down'));
    const budget = createLeadBudget();

    await expect(budget.run(valid, transcript)).resolves.toMatchObject({ ok: false });

    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    await expect(budget.run(valid, transcript)).resolves.toEqual({ ok: true });
    expect(deliverEnquiry).toHaveBeenCalledTimes(2);
  });

  // Half two: however many attempts succeed, only the first is delivered.
  it('delivers only the first of two successful attempts in the same request', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();

    await expect(budget.run(valid, transcript)).resolves.toEqual({ ok: true });
    const second = await budget.run(valid, transcript);
    expect(second.ok).toBe(false);
    expect(second.error).toBeTruthy();
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });

  // Any number of failures still cannot become more than one email.
  it('still delivers at most one email across a long run of mixed attempts', async () => {
    vi.mocked(deliverEnquiry).mockResolvedValue(undefined);
    const budget = createLeadBudget();

    for (let i = 0; i < 5; i += 1) await budget.run(badEmail, transcript);
    const results = [];
    for (let i = 0; i < 5; i += 1) results.push(await budget.run(valid, transcript));

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(deliverEnquiry).toHaveBeenCalledOnce();
  });
});
