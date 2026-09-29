import type { LeadAnalysis, Urgency } from '@/lib/lead-analysis';
import type { Enquiry } from '@/lib/enquiry-delivery';

/**
 * Renders the enquiry email, in both HTML and plain text.
 *
 * Every value that reaches the HTML came from a visitor, so it is escaped here
 * without exception. `escapeHtml` is the only way text enters the template —
 * if you add a field, it goes through it too.
 */

/** Ampersand first, or it double-escapes the entities added after it. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escaped first, then newlines become breaks — never the other way round. */
const escapeWithBreaks = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br>');

const C = {
  page: '#f4f4f5',
  card: '#ffffff',
  ink: '#18181b',
  muted: '#52525b',
  faint: '#71717a',
  border: '#e4e4e7',
  crimson: '#a10005',
  wash: '#fafafa',
} as const;

const URGENCY_COLOUR: Record<Urgency, string> = {
  high: '#a10005',
  medium: '#b45309',
  low: '#3f6212',
  unclear: '#52525b',
};

const sourceLabel = (source: Enquiry['source']) =>
  source === 'chat' ? 'Website assistant' : 'Contact form';

/**
 * Formatted in Toronto time, because that is where the team reads it. An email
 * timestamped in UTC makes everyone do arithmetic before they can tell whether
 * an enquiry is fresh.
 */
export function formatTimestamp(at: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(at);
}

/**
 * Subject lines are scanned in a list, so the useful parts go first: who, and
 * what they want. CR/LF is stripped at the delivery boundary as well; doing it
 * here too costs nothing and keeps this function safe on its own.
 */
export function buildSubject(e: Enquiry, analysis: L | null): string {
  const who = e.company ? `${e.name} (${e.company})` : e.name;
  const what = analysis?.interest && analysis.interest !== 'general' ? analysis.interest : null;
  const base = what ? `${who} — ${what}` : who;
  return `Website enquiry from ${base}`.replace(/[\r\n]+/g, ' ');
}

type L = LeadAnalysis;

/* ------------------------------------------------------------------ text -- */

export function renderText(e: Enquiry, analysis: L | null, at: Date): string {
  const lines: (string | null)[] = [
    `Source: ${e.source}`,
    `Received: ${formatTimestamp(at)}`,
    '',
    `Name: ${e.name}`,
    e.email ? `Email: ${e.email}` : 'Email: not given',
    e.phone ? `Phone: ${e.phone}` : null,
    e.company ? `Company: ${e.company}` : null,
    `Interest: ${e.interest || analysis?.interest || 'general'}`,
    e.consent ? `Consent: ${e.consent}` : null,
    '',
    'MESSAGE',
    e.message,
  ];

  if (analysis) {
    lines.push(
      '',
      'BRIEFING (written by Claude from this enquiry — advisory, not verified)',
      analysis.summary,
      '',
      `Likely interest: ${analysis.interest}`,
      `Apparent urgency: ${analysis.urgency}`,
    );
    if (analysis.signals.length) {
      lines.push('', 'What the enquiry shows:', ...analysis.signals.map((s) => `  - ${s}`));
    }
    if (analysis.unknowns.length) {
      lines.push('', 'Still to find out:', ...analysis.unknowns.map((s) => `  - ${s}`));
    }
    if (analysis.suggestedNextStep) {
      lines.push('', `Suggested next step: ${analysis.suggestedNextStep}`);
    }
    lines.push(
      '',
      'SUGGESTED REPLY (a draft — read it before you send it)',
      analysis.reply,
    );
  }

  if (e.transcript?.length) {
    lines.push('', 'FULL CONVERSATION');
    for (const turn of e.transcript) {
      lines.push(`${turn.role === 'user' ? 'Visitor' : 'Assistant'}: ${turn.content}`);
    }
  }

  return lines.filter((l): l is string => l !== null).join('\n');
}

/* ------------------------------------------------------------------ html -- */

const row = (label: string, value: string) => `
<tr>
  <td style="padding:6px 0;vertical-align:top;width:104px;color:${C.faint};font-size:13px;">${escapeHtml(label)}</td>
  <td style="padding:6px 0;vertical-align:top;color:${C.ink};font-size:14px;font-weight:600;">${value}</td>
</tr>`;

const heading = (text: string) => `
<p style="margin:0 0 10px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:${C.faint};font-weight:700;">${escapeHtml(text)}</p>`;

const bullets = (items: string[]) =>
  `<ul style="margin:0;padding-left:18px;color:${C.ink};font-size:14px;line-height:1.55;">${items
    .map((i) => `<li style="margin:0 0 4px;">${escapeHtml(i)}</li>`)
    .join('')}</ul>`;

function contactBlock(e: Enquiry): string {
  const rows = [
    row('Name', escapeHtml(e.name)),
    e.email
      ? row(
          'Email',
          `<a href="mailto:${escapeHtml(e.email)}" style="color:${C.crimson};text-decoration:none;">${escapeHtml(e.email)}</a>`,
        )
      : row('Email', `<span style="color:${C.faint};font-weight:400;">not given — reply by phone</span>`),
    e.phone
      ? row(
          'Phone',
          `<a href="tel:${escapeHtml(e.phone.replace(/[^\d+]/g, ''))}" style="color:${C.crimson};text-decoration:none;">${escapeHtml(e.phone)}</a>`,
        )
      : null,
    e.company ? row('Company', escapeHtml(e.company)) : null,
  ].filter((r): r is string => r !== null);

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rows.join('')}</table>`;
}

function analysisBlock(a: L): string {
  const badge = `<span style="display:inline-block;padding:2px 9px;border-radius:999px;background:${URGENCY_COLOUR[a.urgency]};color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">${escapeHtml(a.urgency)}</span>`;

  return `
<tr><td style="padding:0 28px;"><hr style="border:0;border-top:1px solid ${C.border};margin:24px 0;"></td></tr>
<tr><td style="padding:0 28px;">
  ${heading('Briefing')}
  <p style="margin:0 0 14px;font-size:12px;color:${C.faint};line-height:1.5;">
    Written by Claude from this enquiry alone. Advisory and unverified — check it before you rely on it.
  </p>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.ink};">${escapeWithBreaks(a.summary)}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
    ${row('Interest', escapeHtml(a.interest))}
    ${row('Urgency', badge)}
  </table>
  ${a.signals.length ? `<div style="margin-top:18px;">${heading('What the enquiry shows')}${bullets(a.signals)}</div>` : ''}
  ${a.unknowns.length ? `<div style="margin-top:18px;">${heading('Still to find out')}${bullets(a.unknowns)}</div>` : ''}
  ${
    a.suggestedNextStep
      ? `<div style="margin-top:18px;">${heading('Suggested next step')}<p style="margin:0;font-size:14px;line-height:1.55;color:${C.ink};">${escapeWithBreaks(a.suggestedNextStep)}</p></div>`
      : ''
  }
</td></tr>

<tr><td style="padding:24px 28px 0;">
  ${heading('Suggested reply')}
  <p style="margin:0 0 10px;font-size:12px;color:${C.faint};line-height:1.5;">
    A draft. Read it, edit it, then send it — it has not been sent to anyone.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${C.border};border-radius:8px;background:${C.wash};">
    <tr><td style="padding:18px 20px;font-size:14px;line-height:1.65;color:${C.ink};white-space:pre-wrap;">${escapeWithBreaks(a.reply)}</td></tr>
  </table>
</td></tr>`;
}

function transcriptBlock(turns: NonNullable<Enquiry['transcript']>): string {
  const items = turns
    .map((t) => {
      const visitor = t.role === 'user';
      return `
<tr><td style="padding:0 0 10px;">
  <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${visitor ? C.crimson : C.faint};">${visitor ? 'Visitor' : 'Assistant'}</p>
  <p style="margin:0;font-size:14px;line-height:1.6;color:${C.ink};">${escapeWithBreaks(t.content)}</p>
</td></tr>`;
    })
    .join('');

  return `
<tr><td style="padding:0 28px;"><hr style="border:0;border-top:1px solid ${C.border};margin:24px 0;"></td></tr>
<tr><td style="padding:0 28px;">
  ${heading('Full conversation')}
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${items}</table>
</td></tr>`;
}

export function renderHtml(e: Enquiry, analysis: L | null, at: Date): string {
  const interest = e.interest || analysis?.interest || 'general';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(buildSubject(e, analysis))}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<!-- Shown in the inbox list under the subject, so it carries the useful part. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    analysis?.summary ?? e.message,
  ).slice(0, 180)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:${C.page};">
<tr><td align="center" style="padding:24px 12px;">

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <tr><td style="background:${C.crimson};padding:18px 28px;">
    <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">New enquiry</p>
    <p style="margin:4px 0 0;color:#ffffffcc;font-size:13px;">
      ${escapeHtml(sourceLabel(e.source))} &middot; ${escapeHtml(formatTimestamp(at))}
    </p>
  </td></tr>

  <tr><td style="padding:24px 28px 0;">
    ${heading('Contact')}
    ${contactBlock(e)}
  </td></tr>

  <tr><td style="padding:20px 28px 0;">
    ${heading(e.source === 'chat' ? 'Their first question' : 'Their message')}
    <p style="margin:0;font-size:15px;line-height:1.65;color:${C.ink};">${escapeWithBreaks(e.message)}</p>
  </td></tr>

  ${analysis ? analysisBlock(analysis) : ''}
  ${e.transcript?.length ? transcriptBlock(e.transcript) : ''}

  <tr><td style="padding:24px 28px 26px;">
    <hr style="border:0;border-top:1px solid ${C.border};margin:0 0 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${row('Interest', escapeHtml(interest))}
      ${e.consent ? row('Consent', `<span style="font-weight:400;color:${C.muted};font-size:13px;">${escapeHtml(e.consent)}</span>`) : ''}
    </table>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.55;color:${C.faint};">
      Sent from the Crimson Security website.${
        e.email ? ' Replying to this email reaches the sender directly.' : ''
      }
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
