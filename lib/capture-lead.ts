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
 * CR/LF in a value that ends up in an email subject line is header-injection
 * shaped. Resend takes JSON and builds the message itself, so this cannot
 * actually inject a header — but a newline has no business in a subject, and
 * the guard is free.
 */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

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
  // name and company both land in the email subject — keep them to one line.
  const name = singleLine(str(raw.name, 120));
  const email = str(raw.email, 200);
  const company = singleLine(str(raw.company, 160));
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

/** At most one lead email may leave a single /api/chat request. */
export const MAX_LEADS_PER_REQUEST = 1;

export interface LeadBudget {
  run(input: unknown, transcript: ChatTurn[]): Promise<{ ok: boolean; error?: string }>;
}

/**
 * Bounds how many leads may be DELIVERED within one request.
 *
 * Parallel tool use is on by default, so a single assistant message can carry
 * several `capture_lead` blocks, and the route's tool loop runs up to three
 * times — so without a cap a visitor who steers the model ("send my details ten
 * times") has a plausible path to many emails per request, multiplied again by
 * the per-minute rate limit, all aimed at Crimson's own mailbox. The system
 * prompt's prompt-injection clause is a mitigation; this is the bound.
 *
 * The cap counts successful deliveries, not attempts. An attempt that fails
 * `runCaptureLead`'s validation — a malformed email, a missing name — sends no
 * mail and so contributes nothing to the risk this bounds, while counting it
 * would break the recovery the tool was designed around: the model is handed
 * "That email address is not valid — ask the visitor to confirm it" precisely
 * so it can ask and try again in the same request.
 *
 * Create one per request. Extras come back as an ordinary recoverable
 * `tool_result` the model can read, never as an exception.
 */
export function createLeadBudget(max: number = MAX_LEADS_PER_REQUEST): LeadBudget {
  let delivered = 0;
  /**
   * Attempts that have not resolved yet. A slot is claimed synchronously,
   * before the first await, and released whether the attempt succeeds or
   * fails — so concurrently-mapped tool uses cannot both reach delivery, while
   * a failed attempt still leaves the budget free for a retry.
   */
  let inFlight = 0;

  return {
    async run(input, transcript) {
      if (delivered + inFlight >= max) {
        return {
          ok: false,
          error:
            'The visitor’s details have already been sent to the team in this reply. ' +
            'Do not call this tool again now — tell them someone will be in touch.',
        };
      }

      inFlight += 1;
      try {
        const result = await runCaptureLead(input, transcript);
        if (result.ok) delivered += 1;
        return result;
      } finally {
        inFlight -= 1;
      }
    },
  };
}
