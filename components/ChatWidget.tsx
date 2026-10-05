'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Lightbulb, Loader2, Maximize2, Minimize2, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import { settleTurn, trimForRequest, type Turn } from '@/lib/chat-history';
import type { LeadSubmission } from '@/lib/chat-lead';
import { inputClass } from '@/lib/field-styles';
import { OPENING_QUICK_REPLIES, QUICK_REPLIES } from '@/lib/quick-replies';
import ChatGate from './ChatGate';
import MapleLeaf from './MapleLeaf';

/**
 * Mounted at layout level, outside <main>, and it must stay outside any
 * `.theme-light` ancestor: that class flips the silver/ink tokens for a light
 * section, which would leave this panel light text on a light surface.
 */

/** The site's signature curve — matches Reveal.tsx and the capability panel. */
const EASE = [0.22, 1, 0.36, 1] as const;

const GREETING =
  "Hi — I can answer questions about Crimson Security's services, and put you in touch with the team. What are you looking into?";

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/**
 * Shared by the opening chips and the menu, so the two cannot drift. min-h-11
 * is the 44px WCAG 2.5.5 floor, matching the send button; py-2.5 comes to 41px
 * so it gives way to the minimum. silver-300 reads as an action rather than
 * the muted body silver-400, with silver-100 hover above it.
 */
const CHIP_CLASS =
  'inline-flex min-h-11 items-center rounded-full border border-edge/10 px-4 py-2.5 text-left text-sm leading-snug text-silver-300 transition-colors duration-300 hover:border-silver-400/40 hover:text-silver-100 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Shown when the details could not be emailed. The visitor was told their
 * enquiry would reach the team, so a failure has to be said out loud and has to
 * offer them another way through — silently dropping it is the bug that issue
 * #1 was filed for.
 */
const LEAD_UNDELIVERED =
  'One thing — I could not pass your details to the team just now. Please use the contact form on this page so your enquiry is not lost.';

/**
 * Said out loud on success, not only on failure. A visitor who handed over
 * their details before they were allowed to ask anything should be told those
 * details arrived, rather than left to assume it.
 */
const LEAD_DELIVERED = 'Your details are with the Crimson Security team — they will be in touch.';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  /** Purely presentational — it never touches `turns`. */
  const [maximized, setMaximized] = useState(false);
  /** The suggestions menu behind the input-row trigger. */
  const [menuOpen, setMenuOpen] = useState(false);
  /**
   * The pre-chat details. Null until the gate is satisfied, and it lives here
   * rather than in ChatGate so it survives closing the panel — someone who
   * minimises the assistant and comes back does not fill the form in twice. A
   * hard reload does clear it, which is the same ephemeral rule the
   * conversation itself follows.
   */
  const [lead, setLead] = useState<LeadSubmission | null>(null);
  /** Sent once. Later turns carry no details, so one visitor is one email. */
  const [leadSent, setLeadSent] = useState(false);
  /** Carries its own tone: a delivery failure is not styled like a receipt. */
  const [leadNotice, setLeadNotice] = useState<{
    tone: 'ok' | 'fail';
    text: string;
    reference?: string;
  } | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  /** Announced once per completed turn. Streaming into a live region makes
   *  screen readers unusable, so deltas render outside it. */
  const [announcement, setAnnouncement] = useState('');

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Innermost layer first. Handled here rather than in a second listener
      // so precedence is an early return, not the order two listeners happen
      // to be registered in — Escape must never close the whole assistant
      // while the menu is open.
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      close();
    };
    window.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, menuOpen]);

  // Keep the newest turn in view as it streams.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * The single send path. The form and the quick-reply buttons both call this,
   * so there is no parallel submit logic to keep in step.
   */
  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || pending) return;

    // Captured before any state update, so every exit path below settles
    // against the same starting conversation.
    const before = turns;
    const next: Turn[] = [...before, { role: 'user', content: text }];
    setTurns([...next, { role: 'assistant', content: '' }]);
    setDraft('');
    setError('');
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Hoisted out of the try so the single settle point in `finally` sees them
    // whatever happened — success, thrown error, abort, or an empty stream.
    let answer = '';
    // Acknowledged means the server reached a verdict either way; only then is
    // it safe to stop attaching the details. A request that dies before any
    // verdict leaves them attached, so the next message retries delivery.
    let leadAcknowledged = false;
    let leadFailed = false;
    let leadReference = '';
    let failure = '';
    let aborted = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Trimmed, not truncated on screen: the visitor keeps the whole
        // transcript, the server keeps within its message cap.
        // The details ride along with the FIRST message only, so Crimson gets
        // a lead with a question attached rather than a bare name.
        body: JSON.stringify({
          messages: trimForRequest(next),
          ...(!leadSent && lead ? { lead } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? GENERIC_ERROR);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const event = frame.match(/^event: (.+)$/m)?.[1];
          const data = frame.match(/^data: (.+)$/m)?.[1];
          if (!event || !data) continue;
          const payload = JSON.parse(data) as {
            text?: string;
            message?: string;
            ok?: boolean;
            reference?: string;
          };

          if (event === 'delta' && payload.text) {
            answer += payload.text;
            setTurns([...next, { role: 'assistant', content: answer }]);
          } else if (event === 'lead') {
            leadAcknowledged = true;
            leadFailed = payload.ok !== true;
            leadReference = payload.reference ?? '';
          } else if (event === 'error') {
            throw new Error(payload.message ?? GENERIC_ERROR);
          }
        }
      }
    } catch (err) {
      // An abort is the visitor's own doing, not a failure to report. Anything
      // else becomes a message, but the settling below happens either way.
      if ((err as Error).name === 'AbortError') {
        aborted = true;
      } else {
        failure = (err as Error).message || GENERIC_ERROR;
      }
    } finally {
      if (leadAcknowledged) setLeadSent(true);
      if (leadFailed) {
        setLeadNotice({ tone: 'fail', text: LEAD_UNDELIVERED });
      } else if (leadAcknowledged) {
        setLeadNotice({ tone: 'ok', text: LEAD_DELIVERED, reference: leadReference });
      }

      // Whitespace-only counts as no answer. validateConversation rejects a
      // turn whose content trims to nothing, so storing a bare "\n" would
      // break the NEXT send exactly as a dangling user turn would. The test
      // matters only for the decision — `answer` is stored as produced.
      const hasAnswer = answer.trim().length > 0;

      // The one place the conversation is written back. settleTurn keeps a
      // partial answer and drops an empty exchange outright, so `turns` always
      // alternates and always starts on `user` — see lib/chat-history.ts.
      setTurns(settleTurn(before, text, answer));

      if (hasAnswer) setAnnouncement(answer);

      // With no answer, no turn survives to show what was asked. Put the
      // question back so the visitor can retry without retyping it — unless
      // they have already started typing something else.
      if (!hasAnswer) setDraft((current) => current || text);

      // An abort is the visitor's own doing, not a failure worth showing.
      if (!aborted) {
        if (failure) setError(failure);
        else if (!hasAnswer) setError(GENERIC_ERROR);
      }

      setPending(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendMessage(draft);
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the Crimson Security assistant"
        aria-expanded={open}
        aria-controls="chat-panel"
        /* The mark is mostly crimson, so it needs a non-crimson surface or it
           sinks into the fill. ink-800 sits one step off the ink-900 page base.
           Keep shadow-crimson-cta on both states: without the crimson fill, the
           glow is the only thing making this findable on a dark page. */
        className="silver-border fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink-800 shadow-crimson-cta transition-all duration-300 hover:bg-ink-700 hover:shadow-crimson-cta-hover"
      >
        {/* 36px in a 56px button: the shield, leaf and "C" need the size, and
            it still leaves a ring of surface. Decorative, as in Header.tsx and
            Footer.tsx — the button's aria-label names the action. */}
        <Image
          src="/crimson-security-mark.svg"
          unoptimized
          alt=""
          width={36}
          height={36}
          sizes="36px"
          className="h-9 w-9 object-contain"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="chat-panel"
            role="dialog"
            // Deliberately non-modal: a visitor may legitimately want to Tab back to
            // the page to read something while this stays open. Focus moves in on
            // open and Escape closes it, but nothing traps Tab or inerts the rest of
            // the page — so do not add aria-modal="true" back; that would claim
            // modal behaviour this panel does not (and should not) provide.
            aria-labelledby="chat-heading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            // `layout` animates the maximize/restore size change. Framer is
            // wrapped in MotionConfig reducedMotion="user"; a CSS keyframe
            // would instead have to be registered by name in the
            // prefers-reduced-motion list in app/globals.css.
            layout
            transition={{ duration: 0.35, ease: EASE }}
            // bg-ink-900 is unscoped, so the panel is opaque in both states
            // and at both breakpoints. .card-surface is 90% and stays for its
            // vertical gradient, which composites over this to an opaque
            // result. DO NOT edit .card-surface; four components share it.
            className={`silver-border card-surface fixed inset-x-0 z-50 flex flex-col overflow-hidden rounded-t-3xl bg-ink-900 shadow-card sm:rounded-3xl ${
              // Two sizes on every breakpoint. Mobile used to be stuck in the
              // largest one, so the only way back to the page was to close the
              // assistant. Unmaximized it is now a sheet the page shows above.
              //
              // Mobile heights are dvh, not vh: vh is the LAYOUT viewport, which
              // stays tall while the address bar is showing, so the bottom of
              // the panel — the input row — hides behind browser chrome. dvh
              // tracks the visual viewport as that chrome collapses. Hero.tsx
              // uses 100svh for the same reason.
              maximized
                ? 'top-[4.5rem] h-[calc(100dvh-4.5rem)] sm:inset-x-6 sm:bottom-6 sm:top-[5.5rem] sm:h-auto sm:w-auto'
                : 'bottom-0 h-[80dvh] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[36rem] sm:w-[24rem]'
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-edge/10 px-5 py-4">
              <h2 id="chat-heading" className="flex items-center gap-2.5 font-display text-base font-bold text-silver-50">
                <MapleLeaf className="h-4 w-4 shrink-0 text-crimson-400" />
                Ask Crimson
              </h2>
              <div className="-mr-2 flex items-center">
                {/* Shown at every width: mobile has two sizes too. The label
                    carries the state; no aria-pressed, so it is announced once. */}
                <button
                  type="button"
                  onClick={() => setMaximized((v) => !v)}
                  aria-label={maximized ? 'Restore the assistant' : 'Maximize the assistant'}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50"
                >
                  {maximized ? (
                    <Minimize2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                {/* Stays exactly as it was: closing means minimizing to the
                    launcher. No third control duplicating it. */}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close the assistant"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* The hard gate. Until it is satisfied there is no message log,
                no suggestions and no input — there is nothing to type into,
                which is what makes this a gate rather than a prompt. */}
            {!lead ? (
              <ChatGate onReady={setLead} />
            ) : (
              <>
              {/* min-h-0 is load-bearing: a flex item defaults to min-height
                  auto, so without it a long conversation grows the log past the
                  panel and pushes the input row out of view instead of
                  scrolling inside it. */}
              <div ref={logRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <p className="whitespace-pre-line rounded-xl border border-edge/10 bg-edge/[0.02] p-4 text-sm leading-relaxed text-silver-200">
                  {GREETING}
                </p>

                {/* A way in without typing, for an empty conversation. Four
                    only: the greeting has room for 217px of chips, not the full
                    set. The rest stay reachable all conversation long from the
                    trigger in the input row, and this stands down while that menu
                    is open rather than showing the same questions twice. */}
                {turns.length === 0 && !menuOpen && (
                  <div role="group" aria-label="Suggested questions" className="flex flex-wrap gap-2">
                    {OPENING_QUICK_REPLIES.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => void sendMessage(question)}
                        disabled={pending}
                        className={CHIP_CLASS}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                <ol className="space-y-3">
                  {turns.map((turn, i) => (
                    <li
                      key={i}
                      /* Who spoke is carried by ALIGNMENT first and colour
                         second, so the conversation is readable without
                         decoding a tint. w-fit lets a one-word turn hug its
                         text instead of stretching to the cap, which is what
                         makes the asymmetry visible on short turns; the max-w
                         then bounds a long one. The sr-only prefixes below are
                         unchanged and remain the accessible answer. */
                      className={
                        turn.role === 'user'
                          ? 'ml-auto w-fit max-w-[85%] rounded-xl border border-crimson-400/60 bg-crimson-600/10 p-4 text-sm leading-relaxed text-silver-100'
                          : 'mr-auto w-fit max-w-[95%] rounded-xl border border-edge/10 bg-edge/[0.02] p-4 text-sm leading-relaxed text-silver-200'
                      }
                    >
                      <span className="sr-only">{turn.role === 'user' ? 'You said: ' : 'Assistant said: '}</span>
                      {/* The assistant writes blank-line-separated paragraphs and
                          HTML was collapsing every newline to a space, so answers
                          arrived as one block. pre-line keeps the newlines and
                          still collapses runs of spaces, so wrapped text stays
                          even — pre and pre-wrap would preserve every space and
                          leave it ragged. Scoped to a wrapper rather than the li
                          so the sr-only prefix and the thinking indicator are
                          untouched. */}
                      {turn.content ? (
                        <span className="whitespace-pre-line">{turn.content}</span>
                      ) : (
                        /* The brand mark rather than three generic dots. role="img"
                           so the label is actually exposed — this is not inside an
                           aria-live region, so it is read when focus reaches it and
                           only the completed turn gets announced. align-middle keeps
                           the 16px glyph centred on the baseline instead of sitting
                           on it, so it fits inside the existing line box and the
                           bubble does not shift when the answer replaces it. */
                        <span className="inline-flex items-center align-middle" role="img" aria-label="Thinking">
                          {/* animate-pixel is a pure opacity pulse, already
                              registered in the prefers-reduced-motion list in
                              app/globals.css — no new keyframe to remember, and no
                              transform, so it cannot move anything. */}
                          <MapleLeaf className="animate-pixel h-4 w-4 text-crimson-300" />
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
                  {error && <p className="text-sm text-crimson-300">{error}</p>}
                  {/* Distinct from `error`, which is about the answer. This
                      is about the enquiry: a receipt on success, a route to the
                      contact form on failure. role="status" rather than alert —
                      neither is urgent, and the visitor is mid-conversation. */}
                  {leadNotice && (
                    <p
                      role="status"
                      className={`text-sm ${
                        leadNotice.tone === 'fail' ? 'text-crimson-300' : 'text-silver-400'
                      }`}
                    >
                      {leadNotice.text}
                      {leadNotice.reference && (
                        <>
                          {' '}
                          Your reference is{' '}
                          {/* Monospaced and tracked out: this is a code someone
                              may read aloud or copy into an email. */}
                          <span className="font-mono tracking-wide text-silver-200">
                            {leadNotice.reference}
                          </span>
                          .
                        </>
                      )}
                    </p>
                  )}
              </div>

              <div aria-live="polite" className="sr-only">
                {announcement}
              </div>

              {/* Always in the DOM so aria-controls on the trigger always
                  resolves; display carries the open state. The native hidden
                  attribute would lose to the flex class, since an author rule
                  beats the UA [hidden] rule whatever the specificity. shrink-0
                  keeps its height, so the log gives way instead of the panel
                  overflowing. */}
              <div
                id="chat-suggestions"
                role="group"
                aria-label="Suggested questions"
                /* The full set, so this may need to scroll. max-h caps it at
                   roughly half the shortest panel and overflow-y-auto keeps the
                   growth inside it, so the input row below stays put however many
                   questions there are. */
                className={`${menuOpen ? 'flex' : 'hidden'} max-h-[40dvh] shrink-0 flex-wrap gap-2 overflow-y-auto border-t border-edge/10 px-5 py-4 sm:max-h-64`}
              >
                {QUICK_REPLIES.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void sendMessage(question);
                    }}
                    disabled={pending}
                    className={CHIP_CLASS}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-edge/10 px-5 py-4">
                {/* Left of the input: the send button keeps its position and
                    its crimson weight, and a control that composes is not sat
                    next to the one that sends. A disclosure widget, so
                    aria-expanded and aria-controls do the work; the label
                    reflects state on its own, as the maximize control does, and
                    aria-pressed alongside it would announce the state twice. */}
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-controls="chat-suggestions"
                  aria-label={menuOpen ? 'Hide suggested questions' : 'Show suggested questions'}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50"
                >
                  <Lightbulb className="h-5 w-5" aria-hidden="true" />
                </button>

                <label htmlFor="chat-input" className="sr-only">
                  Your message
                </label>
                <input
                  ref={inputRef}
                  id="chat-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={MAX_USER_MESSAGE_CHARS}
                  placeholder="Ask a question…"
                  autoComplete="off"
                  /* NO text-sm here. iOS Safari zooms the viewport whenever a
                     focused form control is under 16px, and the visitor has to
                     pinch back out. inputClass is text-base for exactly that
                     reason, which is why the contact form never had the problem.
                     py-2.5 stays: at 16px it makes a 46px row, which sits level
                     with the 44px trigger and send buttons beside it. */
                  className={`${inputClass} py-2.5`}
                />
                <button
                  type="submit"
                  disabled={pending || !draft.trim()}
                  aria-label="Send message"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-crimson-button text-white shadow-crimson-cta transition-all duration-300 hover:bg-crimson-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
