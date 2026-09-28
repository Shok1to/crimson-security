import { NextResponse } from 'next/server';
import { deliverEnquiry } from '@/lib/enquiry-delivery';
import { clientKeyFromHeaders, rateLimiter } from '@/lib/rate-limit';

/**
 * Contact form handler.
 *
 * Validates input, screens bots with a honeypot, and delivers the enquiry via deliverEnquiry.
 * Delivery requires RESEND_API_KEY; if missing or the transport fails, deliverEnquiry throws
 * and this route returns 500. This intentional failure (not a false success) ensures the form
 * shows its error state instead of claiming the message was sent when it wasn't.
 *
 * Because it now genuinely sends mail, this is an unauthenticated endpoint that costs
 * something per POST. It shares the chat endpoint's rate limiter — same mailbox, same
 * Resend quota, so the same bound. The honeypot stops naive bots and nothing more.
 */

type Field = 'name' | 'email' | 'message';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A newline has no business in an email subject. See lib/capture-lead.ts. */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

export async function POST(request: Request) {
  // Before parsing the body, matching the chat route's cheapest-first ordering.
  const limit = await rateLimiter.check(clientKeyFromHeaders(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const str = (key: string, max: number) =>
    typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '';

  // Honeypot: real visitors never fill this in. Pretend success so bots learn nothing.
  if (str('website', 200)) return NextResponse.json({ ok: true });

  // name and company both land in the email subject — keep them to one line.
  const name = singleLine(str('name', 120));
  const email = str('email', 200);
  const company = singleLine(str('company', 160));
  const phone = str('phone', 40);
  const interest = str('interest', 120);
  const message = str('message', 5000);

  const errors: Partial<Record<Field, string>> = {};
  if (!name) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  if (message.length < 10) errors.message = 'Please tell us a little more (at least 10 characters).';

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Please check the highlighted fields.', errors }, { status: 422 });
  }

  try {
    await deliverEnquiry({
      source: 'contact-form',
      name,
      email,
      company: company || undefined,
      phone: phone || undefined,
      interest: interest || undefined,
      message,
    });
  } catch (error) {
    // Deliberately no personal data in logs.
    console.error('[contact] delivery failed', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'We could not send your message just now. Please try again shortly.' },
      { status: 500 },
    );
  }

  // Deliberately no personal data in logs.
  console.info('[contact] enquiry delivered', { interest: interest || 'general' });

  return NextResponse.json({ ok: true });
}
