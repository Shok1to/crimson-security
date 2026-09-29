import type { LeadAnalysis, Urgency } from '@/lib/lead-analysis';
import type { Enquiry } from '@/lib/enquiry-delivery';
import { LOGO_CONTENT_ID } from '@/lib/enquiry-logo';
import { addressCityLine, site } from '@/lib/site';

/**
 * Renders the enquiry email, in both HTML and plain text.
 *
 * Every value that reaches the HTML came from a visitor, so it is escaped here
 * without exception. `escapeHtml` is the only way text enters the template —
 * if you add a field, it goes through it too.
 *
 * The markup is tables and inline styles because that is what email clients
 * render. Flexbox, grid, class selectors and external stylesheets are not
 * available here; Outlook in particular still uses Word's engine.
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
  page: '#f5f5f4',
  card: '#ffffff',
  ink: '#0d0d0d',
  text: '#1c1917',
  muted: '#57534e',
  faint: '#a8a29e',
  hairline: '#ebe9e7',
  border: '#e7e5e4',
  crimson: '#a10005',
  crimsonBright: '#e3220f',
  wash: '#fafaf9',
} as const;

/** Side padding. Generous on purpose — cramped margins are what cheap looks like. */
const PAD = '40px';

const URGENCY: Record<Urgency, { bg: string; label: string }> = {
  high: { bg: '#a10005', label: 'High' },
  medium: { bg: '#b45309', label: 'Medium' },
  low: { bg: '#3f6212', label: 'Low' },
  unclear: { bg: '#78716c', label: 'Unclear' },
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
  /**
   * The reference LEADS the subject. Inbox list views truncate the end, and a
   * reference the visitor can quote is worthless if it is the part that gets
   * cut — this is the same reason ticketing systems put it here.
   */
  const ref = e.reference ? `[${e.reference}] ` : '';
  return `${ref}Website enquiry from ${base}`.replace(/[\r\n]+/g, ' ');
}

type L = LeadAnalysis;

/** First name only, for a button label that has to stay short. */
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/* ------------------------------------------------------------------ text -- */

export function renderText(e: Enquiry, analysis: L | null, at: Date): string {
  const lines: (string | null)[] = [
    `${site.name.toUpperCase()} — NEW ENQUIRY`,
    '',
    `Source: ${e.source}`,
    `Received: ${formatTimestamp(at)}`,
    '',
    e.reference ? `Reference: ${e.reference}` : null,
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
      `Apparent urgency: ${URGENCY[analysis.urgency].label}`,
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
    lines.push('', 'SUGGESTED REPLY (a draft — read it before you send it)', analysis.reply);
  }

  if (e.transcript?.length) {
    lines.push('', 'FULL CONVERSATION');
    for (const turn of e.transcript) {
      lines.push(`${turn.role === 'user' ? 'Visitor' : 'Assistant'}: ${turn.content}`);
    }
  }

  lines.push('', '—', `${site.name} · ${site.address.street}, ${addressCityLine}`);

  return lines.filter((l): l is string => l !== null).join('\n');
}

/* ------------------------------------------------------------------ html -- */

const label = (text: string) => `
<p style="margin:0 0 12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${C.faint};font-weight:700;">${escapeHtml(text)}</p>`;

const rule = () =>
  `<tr><td style="padding:0 ${PAD};"><div style="height:1px;line-height:1px;font-size:0;background:${C.hairline};margin:30px 0;">&nbsp;</div></td></tr>`;

const row = (name: string, value: string) => `
<tr>
  <td style="padding:7px 0;vertical-align:top;width:92px;color:${C.faint};font-size:13px;">${escapeHtml(name)}</td>
  <td style="padding:7px 0;vertical-align:top;color:${C.text};font-size:15px;font-weight:600;">${value}</td>
</tr>`;

const bullets = (items: string[]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${items
    .map(
      (i) => `<tr>
  <td style="padding:0 10px 7px 0;vertical-align:top;color:${C.crimsonBright};font-size:14px;line-height:1.6;">&bull;</td>
  <td style="padding:0 0 7px;vertical-align:top;color:${C.text};font-size:14px;line-height:1.6;">${escapeHtml(i)}</td>
</tr>`,
    )
    .join('')}</table>`;

/**
 * A "bulletproof" button: the colour is on the cell so Outlook paints it, the
 * padding is on the anchor so the whole block is clickable everywhere else.
 */
const button = (href: string, text: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td bgcolor="${C.crimson}" style="border-radius:8px;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(text)}</a>
  </td></tr>
</table>`;

/**
 * One click opens a reply already containing the draft, so acting on a lead is
 * a single step rather than a copy, a paste and a tidy-up.
 *
 * Bounded: mailto URLs are truncated by some clients past roughly 2,000
 * characters, and a half-pasted draft is worse than none. Past the limit the
 * subject still prefills and the draft stays in the email to copy.
 */
const MAILTO_BODY_LIMIT = 1400;

function primaryAction(e: Enquiry, analysis: L | null): string {
  if (e.email) {
    const subject = `Re: your enquiry to ${site.name}`;
    const body = analysis?.reply ?? '';
    const encoded = encodeURIComponent(body);
    const query =
      body && encoded.length <= MAILTO_BODY_LIMIT
        ? `?subject=${encodeURIComponent(subject)}&body=${encoded}`
        : `?subject=${encodeURIComponent(subject)}`;
    return button(`mailto:${e.email}${query}`, `Reply to ${firstName(e.name)}`);
  }
  if (e.phone) {
    return button(`tel:${e.phone.replace(/[^\d+]/g, '')}`, `Call ${firstName(e.name)}`);
  }
  return '';
}

function contactBlock(e: Enquiry): string {
  const link = (href: string, text: string) =>
    `<a href="${escapeHtml(href)}" style="color:${C.crimson};text-decoration:none;border-bottom:1px solid ${C.border};">${escapeHtml(text)}</a>`;

  const rows = [
    e.email
      ? row('Email', link(`mailto:${e.email}`, e.email))
      : row(
          'Email',
          `<span style="color:${C.faint};font-weight:400;">not given &mdash; reply by phone</span>`,
        ),
    e.phone ? row('Phone', link(`tel:${e.phone.replace(/[^\d+]/g, '')}`, e.phone)) : null,
    e.company ? row('Company', escapeHtml(e.company)) : null,
  ].filter((r): r is string => r !== null);

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${rows.join('')}</table>`;
}

function analysisBlock(a: L): string {
  const u = URGENCY[a.urgency];

  return `
${rule()}
<tr><td style="padding:0 ${PAD};">
  <!-- Tinted and rule-marked, so what a machine wrote is never mistaken for
       what the visitor wrote. -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:${C.wash};border:1px solid ${C.border};border-left:3px solid ${C.crimson};border-radius:0 10px 10px 0;">
    <tr><td style="padding:26px 28px;">
      ${label('Briefing')}
      <p style="margin:0 0 18px;font-size:12px;line-height:1.55;color:${C.faint};">
        Written by Claude from this enquiry alone. Advisory and unverified &mdash; check it before you rely on it.
      </p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:${C.text};">${escapeWithBreaks(a.summary)}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 10px 0 0;">
            <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${C.card};border:1px solid ${C.border};color:${C.text};font-size:12px;font-weight:600;">${escapeHtml(a.interest)}</span>
          </td>
          <td>
            <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${u.bg};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${escapeHtml(u.label)} urgency</span>
          </td>
        </tr>
      </table>

      ${a.signals.length ? `<div style="margin-top:26px;">${label('What the enquiry shows')}${bullets(a.signals)}</div>` : ''}
      ${a.unknowns.length ? `<div style="margin-top:26px;">${label('Still to find out')}${bullets(a.unknowns)}</div>` : ''}
      ${
        a.suggestedNextStep
          ? `<div style="margin-top:26px;">${label('Suggested next step')}<p style="margin:0;font-size:15px;line-height:1.6;color:${C.text};">${escapeWithBreaks(a.suggestedNextStep)}</p></div>`
          : ''
      }
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:30px ${PAD} 0;">
  ${label('Suggested reply')}
  <p style="margin:0 0 14px;font-size:12px;line-height:1.55;color:${C.faint};">
    A draft. Read it, edit it, then send it &mdash; it has not been sent to anyone.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid ${C.border};border-radius:10px;background:${C.card};">
    <tr><td style="padding:24px 26px;font-size:15px;line-height:1.75;color:${C.text};">${escapeWithBreaks(a.reply)}</td></tr>
  </table>
</td></tr>`;
}

function transcriptBlock(turns: NonNullable<Enquiry['transcript']>): string {
  const items = turns
    .map((t) => {
      const visitor = t.role === 'user';
      return `
<tr><td style="padding:0 0 18px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:2px 0 2px 14px;border-left:2px solid ${visitor ? C.crimson : C.hairline};">
      <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${visitor ? C.crimson : C.faint};">${visitor ? 'Visitor' : 'Assistant'}</p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:${visitor ? C.text : C.muted};">${escapeWithBreaks(t.content)}</p>
    </td></tr>
  </table>
</td></tr>`;
    })
    .join('');

  return `
${rule()}
<tr><td style="padding:0 ${PAD};">
  ${label('Full conversation')}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${items}</table>
</td></tr>`;
}

export function renderHtml(e: Enquiry, analysis: L | null, at: Date): string {
  const interest = e.interest || analysis?.interest || 'general';
  const action = primaryAction(e, analysis);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- Tells a client that auto-inverts to leave this design alone. -->
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(buildSubject(e, analysis))}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-font-smoothing:antialiased;">
<!-- Shown in the inbox list beneath the subject, so it carries the useful part. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(
    analysis?.summary ?? e.message,
  ).slice(0, 180)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:${C.page};">
<tr><td align="center" style="padding:32px 12px 40px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background:${C.card};border:1px solid ${C.border};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Brand. The wordmark is live text beside the mark, so a client that
       blocks images still shows who this is from. -->
  <tr><td bgcolor="${C.ink}" style="padding:22px ${PAD};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-right:11px;vertical-align:middle;">
<!-- cid:, not a URL. See lib/enquiry-logo.ts for why this is embedded. -->
          <img src="cid:${LOGO_CONTENT_ID}" alt="" width="30" height="30" style="display:block;width:30px;height:30px;border:0;">
        </td>
        <td style="vertical-align:middle;">
          <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:.01em;">${escapeHtml(site.name)}</span>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td bgcolor="${C.crimson}" style="height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Leads with the person, because that is what the reader needs first. -->
  <tr><td style="padding:34px ${PAD} 0;">
    <p style="margin:0 0 10px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${C.crimson};font-weight:700;">New enquiry</p>
    <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-.02em;color:${C.text};">${escapeHtml(e.name)}</h1>
    <p style="margin:0;font-size:13px;color:${C.faint};">
      ${escapeHtml(sourceLabel(e.source))} &nbsp;&middot;&nbsp; ${escapeHtml(formatTimestamp(at))}
    </p>
  </td></tr>

  ${action ? `<tr><td style="padding:24px ${PAD} 0;">${action}</td></tr>` : ''}

  ${rule()}

  <tr><td style="padding:0 ${PAD};">
    ${label('Contact')}
    ${contactBlock(e)}
  </td></tr>

  <tr><td style="padding:28px ${PAD} 0;">
    ${label(e.source === 'chat' ? 'Their first question' : 'Their message')}
    <p style="margin:0;font-size:16px;line-height:1.7;color:${C.text};">${escapeWithBreaks(e.message)}</p>
  </td></tr>

  ${analysis ? analysisBlock(analysis) : ''}
  ${e.transcript?.length ? transcriptBlock(e.transcript) : ''}

  ${rule()}

  <tr><td style="padding:0 ${PAD} 34px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${
        e.reference
          ? row(
              'Reference',
              `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em;">${escapeHtml(e.reference)}</span>`,
            )
          : ''
      }
      ${row('Interest', escapeHtml(interest))}
      ${
        e.consent
          ? row(
              'Consent',
              `<span style="font-weight:400;color:${C.muted};font-size:13px;line-height:1.55;">${escapeHtml(e.consent)}</span>`,
            )
          : ''
      }
    </table>
  </td></tr>

  <tr><td bgcolor="${C.ink}" style="padding:24px ${PAD};">
    <p style="margin:0 0 6px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:.04em;">${escapeHtml(site.name)}</p>
    <p style="margin:0 0 10px;color:#8b8683;font-size:12px;line-height:1.6;">
      ${escapeHtml(site.address.street)}, ${escapeHtml(addressCityLine)}
    </p>
    <p style="margin:0;color:#6f6b68;font-size:11px;line-height:1.6;">
      Sent from the ${escapeHtml(site.name)} website.${
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
