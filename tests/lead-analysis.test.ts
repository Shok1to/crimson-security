import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyseLead } from '@/lib/lead-analysis';
import { services } from '@/lib/content';

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const enquiry = {
  source: 'chat',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Can you help with a SOC 2 audit?',
};

/** A well-formed tool call, which individual tests then spoil one field at a time. */
const toolReply = (input: Record<string, unknown>) => ({
  content: [{ type: 'tool_use', name: 'record_analysis', input }],
});

const goodInput = {
  summary: 'Ada is preparing for a SOC 2 audit.',
  interest: 'SSAE 16 / SOC Audits',
  urgency: 'high',
  signals: ['mentioned SOC 2'],
  unknowns: ['timeline'],
  suggested_next_step: 'Call Ada.',
  reply: 'Hi Ada, happy to help.',
};

describe('analyseLead', () => {
  beforeEach(() => {
    createMock.mockReset();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('maps a well-formed tool call onto the analysis', async () => {
    createMock.mockResolvedValue(toolReply(goodInput));

    await expect(analyseLead(enquiry)).resolves.toEqual({
      summary: 'Ada is preparing for a SOC 2 audit.',
      interest: 'SSAE 16 / SOC Audits',
      urgency: 'high',
      signals: ['mentioned SOC 2'],
      unknowns: ['timeline'],
      suggestedNextStep: 'Call Ada.',
      reply: 'Hi Ada, happy to help.',
    });
  });

  it('forces the tool, so the reply is never prose to parse', async () => {
    createMock.mockResolvedValue(toolReply(goodInput));
    await analyseLead(enquiry);

    const [params, options] = createMock.mock.calls[0];
    expect(params.tool_choice).toEqual({ type: 'tool', name: 'record_analysis' });
    // Bounded, because the contact form's visitor is waiting on this request.
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('sends the transcript so the briefing sees the whole conversation', async () => {
    createMock.mockResolvedValue(toolReply(goodInput));
    await analyseLead({
      ...enquiry,
      transcript: [{ role: 'user' as const, content: 'we are a credit union' }],
    });

    expect(createMock.mock.calls[0][0].messages[0].content).toContain('we are a credit union');
  });

  /**
   * The enquiry must reach the team whatever happens here. Every one of these
   * degrades to null, and deliverEnquiry sends the email without a briefing.
   */
  describe('never throws, whatever goes wrong', () => {
    it('returns null when there is no API key', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      await expect(analyseLead(enquiry)).resolves.toBeNull();
      expect(createMock).not.toHaveBeenCalled();
    });

    it('returns null when the request throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      createMock.mockRejectedValue(new Error('upstream exploded'));
      await expect(analyseLead(enquiry)).resolves.toBeNull();
    });

    it('returns null when it times out', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      createMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));
      await expect(analyseLead(enquiry)).resolves.toBeNull();
    });

    it('returns null when no tool block comes back', async () => {
      createMock.mockResolvedValue({ content: [{ type: 'text', text: 'I would rather not.' }] });
      await expect(analyseLead(enquiry)).resolves.toBeNull();
    });

    // A briefing with no summary or no draft is worse than none — it takes up
    // room in the email and tells the team nothing.
    it.each([
      ['summary', { summary: '   ' }],
      ['reply', { reply: '' }],
    ])('returns null when the %s is empty', async (_label, patch) => {
      createMock.mockResolvedValue(toolReply({ ...goodInput, ...patch }));
      await expect(analyseLead(enquiry)).resolves.toBeNull();
    });
  });

  /**
   * A schema enum is a strong hint to the model, not a boundary. Everything
   * that could reach the CRM is re-checked here.
   */
  describe('re-validates the model output', () => {
    it('degrades an unrecognised interest to "general"', async () => {
      createMock.mockResolvedValue(toolReply({ ...goodInput, interest: 'Underwater Basketweaving' }));
      await expect(analyseLead(enquiry)).resolves.toMatchObject({ interest: 'general' });
    });

    it('accepts every real service title', async () => {
      for (const service of services) {
        createMock.mockResolvedValue(toolReply({ ...goodInput, interest: service.title }));
        await expect(analyseLead(enquiry)).resolves.toMatchObject({ interest: service.title });
      }
    });

    it('degrades an unrecognised urgency to "unclear"', async () => {
      createMock.mockResolvedValue(toolReply({ ...goodInput, urgency: 'CATASTROPHIC' }));
      await expect(analyseLead(enquiry)).resolves.toMatchObject({ urgency: 'unclear' });
    });

    it('caps the lists so a runaway response cannot fill the email', async () => {
      createMock.mockResolvedValue(
        toolReply({ ...goodInput, signals: Array.from({ length: 40 }, (_, i) => `signal ${i}`) }),
      );
      const result = await analyseLead(enquiry);
      expect(result!.signals).toHaveLength(6);
    });

    it('drops non-string list entries rather than rendering "[object Object]"', async () => {
      createMock.mockResolvedValue(toolReply({ ...goodInput, signals: ['real', { a: 1 }, null, 7] }));
      await expect(analyseLead(enquiry)).resolves.toMatchObject({ signals: ['real'] });
    });

    it('tolerates lists arriving as something other than an array', async () => {
      createMock.mockResolvedValue(toolReply({ ...goodInput, unknowns: 'not a list' }));
      await expect(analyseLead(enquiry)).resolves.toMatchObject({ unknowns: [] });
    });
  });
});
