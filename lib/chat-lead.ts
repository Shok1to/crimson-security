import { MAX_LEAD_CONTACT_CHARS, MAX_LEAD_NAME_CHARS } from '@/lib/chat-config';
import { deliverEnquiry } from '@/lib/enquiry-delivery';

/**
 * The details the visitor gives before the conversation starts.
 *
 * Shared by the widget and the route deliberately: the gate is a hard one, so
 * the client and the server must agree on what counts as a valid contact or the
 * visitor gets past one and is rejected by the other. Client-side validation is
 * a courtesy; THIS module's server-side call is the boundary.
 */

/** Which field an error belongs to, so the widget can mark the right input. */
export type LeadField = 'name' | 'contact' | 'consent';

/**
 * What the gate collects and what the widget posts, verbatim. One field for the
 * contact because the visitor chooses which to give; `validateLead` works out
 * which it is. Normalisation happens server-side, so the wire shape stays the
 * visitor's own input.
 */
export interface LeadSubmission {
  name: string;
  contact: string;
  consent: boolean;
}

export interface NormalisedLead {
  name: string;
  /** Empty when the visitor gave a phone number instead. */
  email: string;
  /** Empty when the visitor gave an email address instead. */
  phone: string;
}

export type LeadValidation =
  | { ok: true; lead: NormalisedLead }
  | { ok: false; field: LeadField; error: string };

/** Same rule as the contact route and the old capture_lead tool, so every path
 *  on the site agrees on what an email address is. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * E.164 allows at most 15 digits, and the shortest number anyone would type
 * here is a 10-digit NANP one. Separators, brackets and a leading + are all
 * stripped before counting, so "+1 (416) 555-0134" passes on its 11 digits.
 */
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

/** CR/LF has no business in a value that reaches an email subject line. */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? singleLine(value).trim().slice(0, max) : '';

const digitsOf = (value: string) => value.replace(/\D/g, '');

/**
 * A phone number, loosely. Deliberately permissive about shape — extensions,
 * country codes and every separator style are things real people type, and
 * rejecting a reachable number to enforce a format would cost a lead for
 * nothing. The digit count is the only real test.
 */
function looksLikePhone(value: string): boolean {
  if (!/^[+(\d][\d\s().+\-x]*$/i.test(value)) return false;
  const digits = digitsOf(value);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

/**
 * Validates the pre-chat details. One field accepts either an email address or
 * a phone number, so the error has to name both possibilities — a visitor who
 * typed a phone number should not be told their email is wrong.
 */
export function validateLead(input: unknown): LeadValidation {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, field: 'name', error: 'Please fill in your details.' };
  }

  const raw = input as Record<string, unknown>;
  const name = str(raw.name, MAX_LEAD_NAME_CHARS);
  const contact = str(raw.contact, MAX_LEAD_CONTACT_CHARS);

  if (!name) {
    return { ok: false, field: 'name', error: 'Please enter your name.' };
  }
  if (!contact) {
    return {
      ok: false,
      field: 'contact',
      error: 'Please enter an email address or phone number.',
    };
  }

  const isEmail = EMAIL_RE.test(contact);
  const isPhone = !isEmail && looksLikePhone(contact);

  if (!isEmail && !isPhone) {
    return {
      ok: false,
      field: 'contact',
      // Names both forms, because one field accepts both and the visitor
      // should not have to guess which one it read theirs as.
      error: 'That does not look like an email address or a phone number.',
    };
  }

  // Consent is the lawful basis for contacting them, so it is checked as
  // strictly as the contact details themselves. Anything other than a literal
  // true — absent, "false", 1 — is not consent.
  if (raw.consent !== true) {
    return {
      ok: false,
      field: 'consent',
      error: 'Please agree to be contacted so we can reply.',
    };
  }

  return {
    ok: true,
    lead: {
      name,
      email: isEmail ? contact : '',
      phone: isPhone ? contact : '',
    },
  };
}

/**
 * The consent wording, recorded in the email so Crimson holds evidence of what
 * was actually agreed to rather than a bare "consent: true". Exported so the
 * gate's checkbox label and this record cannot drift apart — the label the
 * visitor read IS the record.
 */
export const CONSENT_STATEMENT =
  'I agree that Crimson Security may contact me about this enquiry.';

/**
 * Delivers the lead with the visitor's first question as the enquiry body.
 *
 * Returns rather than throws: the visitor asked a question, and a delivery
 * failure must not cost them their answer. The caller reports the outcome so
 * nothing is lost silently — the failure mode issue #1 existed to kill.
 */
export async function deliverLead(
  lead: NormalisedLead,
  question: string,
  at: Date,
): Promise<{ ok: boolean; reference?: string }> {
  try {
    // The reference comes back from the delivery, so the code shown to the
    // visitor is the same one that led the email subject — not a second value
    // generated alongside it that could drift.
    const reference = await deliverEnquiry({
      source: 'chat',
      name: lead.name,
      email: lead.email,
      phone: lead.phone || undefined,
      message: question,
      consent: `${CONSENT_STATEMENT} (agreed ${at.toISOString()})`,
    });
    return { ok: true, reference };
  } catch (error) {
    console.error('[chat] lead delivery failed', error instanceof Error ? error.message : error);
    return { ok: false };
  }
}
