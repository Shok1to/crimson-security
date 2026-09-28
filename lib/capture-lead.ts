import type Anthropic from '@anthropic-ai/sdk';
import { services } from '@/lib/content';
import { deliverEnquiry, type ChatTurn } from '@/lib/enquiry-delivery';

/** Same rule the contact route uses, so both paths agree on what an email is. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const captureLeadTool: Anthropic.Tool = {
  name: 'capture_lead',
  description:
    "Send the visitor's details to the Crimson Security team so they can follow " +
    'up. Call this only once you have been given a name and a work email — never ' +
    'invent either. Summarise what the visitor needs in your own words.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: "The visitor's name, as they gave it." },
      email: { type: 'string', description: "The visitor's work email address." },
      company: { type: 'string', description: 'Their company, if mentioned.' },
      interest: {
        type: 'string',
        enum: [...services.map((s) => s.title), 'general'],
        description: 'Closest matching service, or "general".',
      },
      summary: {
        type: 'string',
        description: 'What the visitor needs, in your own words.',
      },
    },
    required: ['name', 'email', 'summary'],
    additionalProperties: false,
  },
};

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/**
 * Executes the tool. The model's output is untrusted input — every field is
 * re-validated here, and every failure comes back as a result the model can
 * recover from rather than an exception that would kill the stream.
 */
export async function runCaptureLead(
  input: unknown,
  transcript: ChatTurn[],
): Promise<{ ok: boolean; error?: string }> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Invalid arguments.' };
  }

  const raw = input as Record<string, unknown>;
  const name = str(raw.name, 120);
  const email = str(raw.email, 200);
  const company = str(raw.company, 160);
  const interest = str(raw.interest, 120);
  const summary = str(raw.summary, 2000);

  if (!name) return { ok: false, error: 'A name is required — ask the visitor for it.' };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'That email address is not valid — ask the visitor to confirm it.' };
  }
  if (!summary) return { ok: false, error: 'A summary is required.' };

  try {
    await deliverEnquiry({
      source: 'chat',
      name,
      email,
      company: company || undefined,
      interest: interest || undefined,
      message: summary,
      transcript,
    });
  } catch (error) {
    console.error('[chat] lead delivery failed', error instanceof Error ? error.message : error);
    return { ok: false, error: 'Could not send those details just now.' };
  }

  return { ok: true };
}
