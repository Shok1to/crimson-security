'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { MAX_LEAD_CONTACT_CHARS, MAX_LEAD_NAME_CHARS } from '@/lib/chat-config';
import {
  CONSENT_STATEMENT,
  validateLead,
  type LeadField,
  type LeadSubmission,
} from '@/lib/chat-lead';
import { inputClass, labelClass } from '@/lib/field-styles';

/**
 * The panel's first screen. Nothing can be asked until this is filled in.
 *
 * It validates with the SAME function the route uses, so the two cannot
 * disagree about what a valid contact is — a visitor must never get past this
 * only to be rejected by the server. This side is the courtesy; the server's
 * call is the boundary.
 */
export default function ChatGate({
  onReady,
}: {
  onReady: (lead: LeadSubmission) => void;
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [failed, setFailed] = useState<{ field: LeadField; error: string } | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  // Unique per instance, so the ids stay valid if this is ever mounted twice.
  const uid = useId();
  const nameId = `${uid}-name`;
  const contactId = `${uid}-contact`;
  const consentId = `${uid}-consent`;
  const errorId = `${uid}-error`;
  const hintId = `${uid}-hint`;

  // The panel's open effect focuses the chat input, which does not exist yet
  // while this is showing, so this screen takes its own focus on mount.
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submission: LeadSubmission = { name, contact, consent };
    const check = validateLead(submission);

    if (!check.ok) {
      setFailed({ field: check.field, error: check.error });
      // Focus follows the error rather than leaving the visitor to find it.
      const target =
        check.field === 'name' ? nameRef : check.field === 'contact' ? contactRef : consentRef;
      target.current?.focus();
      return;
    }

    setFailed(null);
    // The raw values, not the normalised ones: the server re-validates and is
    // the only place that decides what these mean.
    onReady(submission);
  }

  const invalid = (field: LeadField) => failed?.field === field;
  const describedBy = (field: LeadField) => (invalid(field) ? errorId : undefined);

  return (
    /* min-h-0 and the scroll are load-bearing on a phone: with the keyboard up
       the sheet loses roughly half its height, and the submit button has to
       stay reachable rather than being pushed out of the panel. */
    <form
      onSubmit={onSubmit}
      noValidate
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
    >
      <p className="text-sm leading-relaxed text-silver-200">
        Before we start, who should the team get back to? Ask anything after this — your details
        go straight to Crimson with your first question.
      </p>

      <div>
        <label htmlFor={nameId} className={labelClass}>
          Your name
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_LEAD_NAME_CHARS}
          autoComplete="name"
          aria-invalid={invalid('name')}
          aria-describedby={describedBy('name')}
          /* NO text-sm anywhere in this form. iOS Safari zooms the viewport
             whenever a focused control is under 16px and the visitor has to
             pinch back out; inputClass is text-base for exactly that reason. */
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={contactId} className={labelClass}>
          Email or phone
        </label>
        <input
          ref={contactRef}
          id={contactId}
          name="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={MAX_LEAD_CONTACT_CHARS}
          /* One field for two kinds of value, so neither `email` nor `tel`
             is right: type="email" would have the browser reject a phone
             number, and inputMode would bring up the wrong keyboard for half
             of visitors. Plain text, validated by us. */
          autoComplete="on"
          aria-invalid={invalid('contact')}
          aria-describedby={describedBy('contact') ?? hintId}
          className={inputClass}
        />
        <p id={hintId} className="mt-2 text-xs text-silver-400">
          Whichever you prefer to be reached on.
        </p>
      </div>

      <div className="flex items-start gap-3">
        {/* Unticked by default, and it stays that way. A pre-ticked box is not
            meaningful consent under PIPEDA, so this must never be given a
            defaultChecked. h-5/w-5 with mt-0.5 sits it on the first line of
            the label rather than centred against two. */}
        <input
          ref={consentRef}
          id={consentId}
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={invalid('consent')}
          aria-describedby={describedBy('consent')}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-edge/30 bg-ink-800 accent-crimson-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-300/40"
        />
        <label htmlFor={consentId} className="text-sm leading-relaxed text-silver-200">
          {CONSENT_STATEMENT}
        </label>
      </div>

      {/* One error at a time, so one live region. role="alert" announces it
          without the visitor having to go looking. */}
      {failed && (
        <p id={errorId} role="alert" className="text-sm text-crimson-300">
          {failed.error}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-crimson-button px-5 text-sm font-medium text-white shadow-crimson-cta transition-all duration-300 hover:bg-crimson-button-hover"
      >
        Start chatting
      </button>

      <p className="text-xs leading-relaxed text-silver-400">
        We use this only to reply to you. See our{' '}
        <Link
          href="/privacy"
          className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
        >
          Privacy Policy
        </Link>
        . This chat is not a secure channel, so please keep technical details for a direct
        conversation with the team.
      </p>
    </form>
  );
}
