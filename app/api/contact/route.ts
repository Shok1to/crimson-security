import { NextResponse } from 'next/server';

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

  // TODO: deliver the enquiry (email / CRM). `name`, `email`, `company`, `phone`,
  // `interest` and `message` are validated and ready to use here.
  void { name, email, company, phone, message };

  // Deliberately no personal data in logs.
  console.info('[contact] enquiry received', { interest: interest || 'general' });

  return NextResponse.json({ ok: true });
}
