'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import { inputClass } from '@/lib/field-styles';
import MapleLeaf from './MapleLeaf';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

/** The site's signature curve — matches Reveal.tsx and the capability panel. */
const EASE = [0.22, 1, 0.36, 1] as const;

const GREETING =
  "Hi — I can answer questions about Crimson Security's services, and put you in touch with the team. What are you looking into?";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;

    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns([...next, { role: 'assistant', content: '' }]);
    setDraft('');
    setError('');
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Something went wrong.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

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
          const payload = JSON.parse(data) as { text?: string; message?: string };

          if (event === 'delta' && payload.text) {
            answer += payload.text;
            setTurns([...next, { role: 'assistant', content: answer }]);
          } else if (event === 'error') {
            throw new Error(payload.message ?? 'Something went wrong.');
          }
        }
      }

      // A completed stream with no text is not a usable turn — drop the empty
      // placeholder rather than leaving a turn that can never resolve and that
      // would poison the next request's history.
      if (!answer) {
        setTurns(next);
        setError('Something went wrong. Please try again.');
      } else {
        setAnnouncement(answer);
      }
    } catch (err) {
      // Every non-success exit (thrown error or abort) must drop the empty
      // assistant placeholder — an unresolved empty turn left in history
      // would fail the next request against the Messages API, not our own
      // guard, which is confusing to diagnose.
      setTurns(next);
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
      abortRef.current = null;
    }
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
        <MessageSquare className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
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
            transition={{ duration: 0.35, ease: EASE }}
            className="silver-border card-surface fixed inset-x-0 bottom-0 top-[4.5rem] z-50 flex flex-col overflow-hidden rounded-t-3xl shadow-card sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[36rem] sm:w-[24rem] sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-edge/10 px-5 py-4">
              <h2 id="chat-heading" className="flex items-center gap-2.5 font-display text-base font-bold text-silver-50">
                <MapleLeaf className="h-4 w-4 shrink-0 text-crimson-400" />
                Ask Crimson
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close the assistant"
                className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <p className="rounded-xl border border-edge/10 bg-edge/[0.02] p-4 text-sm leading-relaxed text-silver-200">
                {GREETING}
              </p>
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
