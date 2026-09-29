import { buildSubject, renderHtml, renderText } from '@/lib/enquiry-email';
import { analyseLead, type LeadAnalysis } from '@/lib/lead-analysis';
import { site } from '@/lib/site';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface Enquiry {
  source: 'contact-form' | 'chat';
  name: string;
  /**
   * Empty is legitimate: the chat gate accepts an email address OR a phone
   * number, so a phone-only enquiry carries no email. The contact form still
   * requires one. Everything downstream treats '' as absent.
   */
  email: string;
  company?: string;
  phone?: string;
  interest?: string;
  message: string;
  /** What the visitor agreed to, and when. Present on gated chat enquiries. */
  consent?: string;
  transcript?: ChatTurn[];
  /** Defaults to now. Injectable so the rendering can be tested deterministically. */
  submittedAt?: Date;
}

/**
 * CR/LF has no place in an email subject. Both callers strip it too, but this
 * module is the shared boundary every enquiry crosses, so the invariant must
 * not depend on each future caller remembering. Resend takes JSON and builds
 * the message itself, so this cannot actually inject a header.
 */
const subjectSafe = (value: string) => value.replace(/[\r\n]+/g, ' ');

async function sendViaResend(e: Enquiry, analysis: LeadAnalysis | null): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('Enquiry delivery is not configured: RESEND_API_KEY is unset.');
  }

  const at = e.submittedAt ?? new Date();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Must be an address on a domain verified in Resend, or the send is
      // rejected. The fallback is the expected production value, so an unset
      // variable fails loudly at Resend rather than silently sending as
      // something unexpected.
      from: process.env.RESEND_FROM_EMAIL || 'website@crimsonsecurityinc.ca',
      to: [site.emails.info],
      // Omitted entirely rather than sent empty: a phone-only enquiry has no
      // address to reply to, and Resend rejects a blank one.
      ...(e.email ? { reply_to: e.email } : {}),
      subject: subjectSafe(buildSubject(e, analysis)),
      // Both parts, always. Plain text is not a formality: it is what a text-only
      // client, a screen reader and a spam filter each read.
      html: renderHtml(e, analysis, at),
      text: renderText(e, analysis, at),
    }),
  });

  if (!response.ok) {
    throw new Error(`Enquiry delivery failed with status ${response.status}.`);
  }
}

/**
 * Single delivery path for both the contact form and the chat assistant.
 *
 * It THROWS on every failure, including missing configuration. Silent success
 * is the bug this module exists to prevent: the previous contact route returned
 * `{ok: true}` while discarding the enquiry, so visitors were thanked and their
 * messages vanished. Callers must surface the failure.
 */
export async function deliverEnquiry(enquiry: Enquiry): Promise<void> {
  /**
   * Awaited, so one email carries the enquiry and its briefing together — two
   * emails per lead would be worse than none of this. `analyseLead` swallows
   * its own failures and returns null, and it is time-bounded, so a slow or
   * broken analysis costs the briefing and never the enquiry.
   */
  const analysis = await analyseLead(enquiry);
  await sendViaResend(enquiry, analysis);
}
