import { NextResponse } from 'next/server';
import { deliverEnquiry } from '@/lib/enquiry-delivery';

/**
 * PLACEHOLDER contact handler.
 *
 * It validates input and screens out bots, but it does NOT deliver the message anywhere yet.
 * Before launch, replace the marked TODO with a real delivery step (e.g. Resend / Postmark /
 * SES email, or a CRM webhook) and add its API key as a Vercel environment variable.
 */

type Field = 'name' | 'email' | 'message';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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

  const name = str('name', 120);
  const email = str('email', 200);
  const company = str('company', 160);
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
