'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Maximize2, Minimize2, Send, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import { settleTurn, trimForRequest, type Turn } from '@/lib/chat-history';
import { inputClass } from '@/lib/field-styles';
import { QUICK_REPLIES } from '@/lib/quick-replies';
import MapleLeaf from './MapleLeaf';

/** The site's signature curve — matches Reveal.tsx and the capability panel. */
const EASE = [0.22, 1, 0.36, 1] as const;

const GREETING =
  "Hi — I can answer questions about Crimson Security's services, and put you in touch with the team. What are you looking into?";

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/**
 * Stands in when a lead was delivered but the model produced no closing text —
 * the tool loop can exhaust its iterations still in `tool_use`. Telling the
 * visitor it failed after their details were already emailed is the exact
 * mirror of the silent-discard bug this branch exists to fix.
 */
const LEAD_CONFIRMED =
  "Thanks — I've passed your details to the Crimson Security team. They'll follow up by email.";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  /** Purely presentational — it never touches `turns`. */
  const [maximized, setMaximized] = useState(false);
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
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

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
    let leadDelivered = false;
    let failure = '';
    let aborted = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Trimmed, not truncated on screen: the visitor keeps the whole
        // transcript, the server keeps within its message cap.
        body: JSON.stringify({ messages: trimForRequest(next) }),
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
          const payload = JSON.parse(data) as { text?: string; message?: string; ok?: boolean };

          if (event === 'delta' && payload.text) {
            answer += payload.text;
            setTurns([...next, { role: 'assistant', content: answer }]);
          } else if (event === 'lead' && payload.ok) {
            leadDelivered = true;
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
      // The lead reached the team, so this turn succeeded even if no text came
      // back. Speak for the model rather than reporting a failure that did not
      // happen.
      if (!answer.trim() && leadDelivered) answer = LEAD_CONFIRMED;

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

      // A delivered lead means this turn did its job, and an abort is the
      // visitor's own doing. Neither is a failure worth putting on screen.
      if (!leadDelivered && !aborted) {
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
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-crimson-button text-white shadow-crimson-cta transition-all duration-300 hover:bg-crimson-button-hover hover:shadow-crimson-cta-hover"
      >
        {/* A shield rather than a speech bubble: the entry point should read as
            security, and it echoes the shield in the site's own logo mark.
            Keeping strokeWidth 1.8 — heavier than the 1.5 the in-content
            service icons use, because this is white on saturated crimson at
            24px, where 1.5 goes thin and loses the CTA's presence. */}
        <ShieldCheck className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
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
            // `layout` is what animates the maximize/restore size change, using
            // the transition below — the site's easing at 0.35s. Framer is
            // wrapped in MotionConfig reducedMotion="user", so this is covered
            // without a CSS keyframe that would have to be remembered in the
            // prefers-reduced-motion list in app/globals.css.
            layout
            transition={{ duration: 0.35, ease: EASE }}
            className={`silver-border card-surface fixed inset-x-0 bottom-0 top-[4.5rem] z-50 flex flex-col overflow-hidden rounded-t-3xl shadow-card sm:rounded-3xl ${
              // Below sm the panel is already a near-fullscreen sheet, so only
              // the sm: classes differ. Maximized leaves the 4.5rem site header
              // clear and keeps a margin on the other three sides.
              //
              // It also gets a near-opaque surface and a backdrop blur.
              // .card-surface is 90% opaque with no backdrop-filter, which
              // reads as pleasant depth at the restored card's size but
              // collects far too much background when the panel is most of the
              // viewport — over the hero, the headline read straight through
              // the message area.
              //
              // Blur alone does not settle it. Blur radius works against stroke
              // width, and the hero headline is set around 60px with strokes
              // far thicker than anything else on the page: at blur(24px) the
              // body copy becomes an unreadable wash but that headline still
              // shows discernible letterforms. Pushing the radius higher to
              // defeat 60px type starts to read as frosted glass rather than a
              // surface, and costs more to composite on an element this large.
              //
              // So bg-ink-900/95 kills the transmission outright — .card-surface
              // sets `background` as a shorthand in @layer components, so this
              // background-color utility from @layer utilities lands underneath
              // the gradient instead of replacing it, putting the surface near
              // 99.5% opaque — while the blur keeps the softness at the edges
              // where a little of the page still shows.
              //
              // Both are confined to this branch: the restored card is
              // untouched and still measures backdropFilter "none", and
              // .card-surface itself is not edited, so ContactSection,
              // CapabilityTabs, ServicesGrid and StoryCards are unaffected —
              // they are in-flow over backgrounds their own section controls,
              // which is the assumption this fixed-position panel broke.
              maximized
                ? 'sm:inset-x-6 sm:bottom-6 sm:top-[5.5rem] sm:h-auto sm:w-auto sm:bg-ink-900/95 sm:backdrop-blur-xl'
                : 'sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[36rem] sm:w-[24rem]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-edge/10 px-5 py-4">
              <h2 id="chat-heading" className="flex items-center gap-2.5 font-display text-base font-bold text-silver-50">
                <MapleLeaf className="h-4 w-4 shrink-0 text-crimson-400" />
                Ask Crimson
              </h2>
              <div className="-mr-2 flex items-center">
                {/* Hidden below sm, where the panel is already a near-fullscreen
                    sheet and there is nothing to maximize into. The label
                    carries the state; no aria-pressed, so it is announced once. */}
                <button
                  type="button"
                  onClick={() => setMaximized((v) => !v)}
                  aria-label={maximized ? 'Restore the assistant' : 'Maximize the assistant'}
                  className="hidden h-10 w-10 items-center justify-center rounded-md text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50 sm:inline-flex"
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

            <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <p className="rounded-xl border border-edge/10 bg-edge/[0.02] p-4 text-sm leading-relaxed text-silver-200">
                {GREETING}
              </p>

              {/* A way in without typing. Starting affordance only, so it goes
                  as soon as there is a conversation — not a persistent menu.
                  flex-wrap keeps it off a horizontal scrollbar when narrow. */}
              {turns.length === 0 && (
                <div role="group" aria-label="Suggested questions" className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void sendMessage(question)}
                      disabled={pending}
                      className="rounded-full border border-edge/10 px-3 py-1.5 text-left text-xs leading-snug text-silver-400 transition-colors duration-300 hover:border-silver-400/40 hover:text-silver-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className={
                      turn.role === 'user'
                        ? 'rounded-xl border border-crimson-400/60 bg-crimson-600/10 p-4 text-sm leading-relaxed text-silver-100'
                        : 'rounded-xl border border-edge/10 bg-edge/[0.02] p-4 text-sm leading-relaxed text-silver-200'
                    }
                  >
                    <span className="sr-only">{turn.role === 'user' ? 'You said: ' : 'Assistant said: '}</span>
                    {turn.content || (
                      <span className="inline-flex gap-1" aria-label="Thinking">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-crimson-300"
                            style={{ animationDelay: `${d * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              {error && <p className="text-sm text-crimson-300">{error}</p>}
            </div>

            <div aria-live="polite" className="sr-only">
              {announcement}
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-edge/10 px-5 py-4">
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
                className={`${inputClass} py-2.5 text-sm`}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
