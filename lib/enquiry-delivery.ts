import { site } from '@/lib/site';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface Enquiry {
  source: 'contact-form' | 'chat';
  name: string;
  email: string;
  company?: string;
  phone?: string;
  interest?: string;
  message: string;
  transcript?: ChatTurn[];
}

function renderBody(e: Enquiry): string {
  const lines = [
    `Source: ${e.source}`,
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    e.company ? `Company: ${e.company}` : null,
    e.phone ? `Phone: ${e.phone}` : null,
    `Interest: ${e.interest || 'general'}`,
    '',
    e.message,
  ].filter((l): l is string => l !== null);

  if (e.transcript?.length) {
    lines.push('', '--- conversation ---');
    for (const turn of e.transcript) {
      lines.push(`${turn.role === 'user' ? 'Visitor' : 'Assistant'}: ${turn.content}`);
    }
  }

  return lines.join('\n');
}

/**
 * CR/LF has no place in an email subject. Both callers strip it too, but this
 * module is the shared boundary every enquiry crosses, so the invariant must
 * not depend on each future caller remembering. Resend takes JSON and builds
 * the message itself, so this cannot actually inject a header.
 */
const subjectSafe = (value: string) => value.replace(/[\r\n]+/g, ' ');

async function sendViaResend(e: Enquiry): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('Enquiry delivery is not configured: RESEND_API_KEY is unset.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM ?? 'website@crimsonsecurityinc.ca',
      to: [site.emails.info],
      reply_to: e.email,
      subject: `Website enquiry from ${subjectSafe(e.name)}${
        e.company ? ` (${subjectSafe(e.company)})` : ''
      }`,
      text: renderBody(e),
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
  await sendViaResend(enquiry);
}
