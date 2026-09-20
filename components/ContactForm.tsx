'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { services } from '@/lib/content';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

const inputClass =
  'w-full rounded-lg border border-edge/15 bg-ink-800 px-4 py-3 text-base text-silver-50 placeholder:text-silver-600 transition-colors focus-visible:border-crimson-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-300/40 aria-[invalid=true]:border-crimson-300';
const labelClass = 'mb-2 block font-display text-sm font-medium text-silver-200';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrors({});
    setMessage('');

    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      // Placeholder handler: see app/api/contact/route.ts
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { errors?: FieldErrors; error?: string };

      if (!res.ok) {
        setErrors(data.errors ?? {});
        setMessage(data.error ?? 'Please check the highlighted fields and try again.');
        setStatus('error');
        return;
      }
      form.reset();
      setStatus('success');
    } catch {
      setMessage('Something went wrong sending your message. Please try again in a moment.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="flex min-h-[24rem] flex-col items-center justify-center text-center">
        <CheckCircle2 className="h-12 w-12 text-crimson-300" strokeWidth={1.5} aria-hidden="true" />
        <h3 className="mt-5 font-display text-2xl font-bold text-silver-50">Message received</h3>
        <p className="mt-3 max-w-sm text-silver-300">
          Thanks for reaching out. We&apos;ll follow up with you by email.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 font-display text-sm font-semibold text-crimson-300 underline underline-offset-4 hover:text-silver-50"
        >
          Send another message
        </button>
      </div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <form onSubmit={onSubmit} aria-describedby="form-status" className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name <span className="text-crimson-300">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={inputClass}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-sm text-crimson-300">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Work email <span className="text-crimson-300">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={inputClass}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-crimson-300">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <input id="company" name="company" type="text" maxLength={160} autoComplete="organization" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone <span className="text-silver-500">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="interest" className={labelClass}>
          What do you need help with?
        </label>
        <select id="interest" name="interest" defaultValue="" className={inputClass}>
          <option value="">Not sure yet / general enquiry</option>
          {services.map((s) => (
            <option key={s.id} value={s.title}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message <span className="text-crimson-300">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={`${inputClass} resize-y`}
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-sm text-crimson-300">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div id="form-status" role="status" aria-live="polite" className="min-h-[1.25rem] text-sm text-crimson-300">
        {status === 'error' ? message : ''}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-crimson-button px-8 py-4 font-display text-base font-semibold tracking-wide text-white shadow-crimson-cta transition-all duration-300 hover:bg-crimson-button-hover hover:shadow-crimson-cta-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-xs leading-relaxed text-silver-500 sm:max-w-[16rem]">
          We use your details only to respond to your enquiry. See our{' '}
          <Link href="/privacy" className="text-silver-300 underline underline-offset-2 hover:text-silver-50">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
