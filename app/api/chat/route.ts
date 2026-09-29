import Anthropic from '@anthropic-ai/sdk';
import { CHAT_MODEL, MAX_OUTPUT_TOKENS, MAX_PAYLOAD_CHARS } from '@/lib/chat-config';
import { describeFailure } from '@/lib/chat-failure';
import { buildSystemPrompt } from '@/lib/chat-knowledge';
import { GUARD_MESSAGE, scanAnswer, type GuardPattern } from '@/lib/chat-output-guard';
import { deliverLead, validateLead, type NormalisedLead } from '@/lib/chat-lead';
import { sseEvent, toAnthropicMessages } from '@/lib/chat-stream';
import { validateConversation } from '@/lib/chat-validation';
import { clientKeyFromHeaders, leadLimiter, rateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/**
 * Seconds. MUST stay comfortably above ANALYSIS_TIMEOUT_MS plus the time to
 * send: the lead briefing is awaited before the email goes out, so a function
 * killed mid-analysis would lose the enquiry silently.
 *
 * A literal on purpose -- Next requires route segment config to be statically
 * analysable, so this cannot be imported from lib/chat-config.ts. The pairing
 * is enforced by tests/route-duration.test.ts instead.
 */
export const maxDuration = 30;

/**
 * Constructed on first use, not at module load. Importing this route in a test
 * must not require an API key to be present.
 */
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

/** Built once per instance. Must stay byte-stable for prompt caching to work. */
const SYSTEM_PROMPT = buildSystemPrompt();

const json = (data: unknown, status: number, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export async function POST(request: Request): Promise<Response> {
  // 1. Kill switch — defaults off so merging this cannot expose a billable endpoint.
  if (process.env.CHAT_ENABLED !== 'true') {
    return json({ error: 'The assistant is unavailable right now.' }, 503);
  }

  // 2. Rate limit before anything expensive.
  const limit = await rateLimiter.check(clientKeyFromHeaders(request.headers));
  if (!limit.ok) {
    return json({ error: 'Too many messages. Please wait a moment.' }, 429, {
      'Retry-After': String(limit.retryAfterSeconds ?? 60),
    });
  }

  // 3. Size, then shape.
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_CHARS) {
    return json({ error: 'That conversation is too large.' }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const validation = validateConversation(body);
  if (!validation.ok) {
    return json({ error: validation.error }, 400);
  }

  /**
   * The widget sends this with the FIRST message of a conversation and never
   * again, so an absent `lead` is the normal state of every later turn — not a
   * bypass. The details are what make a conversation useful to Crimson; they
   * are not what authorises it, so there is nothing here to circumvent.
   */
  let lead: NormalisedLead | null = null;
  let leadBlocked = false;
  const rawLead = (body as { lead?: unknown }).lead;

  if (rawLead !== undefined) {
    const check = validateLead(rawLead);
    if (!check.ok) {
      return json({ error: check.error }, 400);
    }

    // A second, much tighter limit. The chat limit allows 15 requests a minute,
    // and a scripted client that attached a lead to each one would turn that
    // into 15 emails. Delivery is the expensive, outward-facing side effect, so
    // it gets its own budget rather than sharing the conversation's.
    const limit = await leadLimiter.check(clientKeyFromHeaders(request.headers));
    if (limit.ok) {
      lead = check.lead;
    } else {
      leadBlocked = true;
      console.warn('[chat] lead delivery rate-limited');
    }
  }

  const encoder = new TextEncoder();
  // Review Focus 3: if the visitor closes the widget, stop consuming and stop billing.
  const abort = new AbortController();
  request.signal.addEventListener('abort', () => abort.abort());

  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(event, data)));

      try {
        const conversation = toAnthropicMessages(validation.messages);

        /**
         * Delivery runs ALONGSIDE the model call, not in front of it. The
         * visitor is waiting on an answer and Resend's round trip has no
         * business delaying the first token. The result is awaited below, so
         * nothing is reported until it is actually known.
         */
        const delivery = lead
          ? deliverLead(
              lead,
              validation.messages[validation.messages.length - 1].content,
              new Date(),
            )
          : null;

        /**
         * The deterministic backstop under the pricing and compliance rules.
         * Scanned across the whole answer, not per delta, because the phrase
         * being caught arrives split across several of them.
         */
        let answer = '';
        let guardTrip: GuardPattern | null = null;

        const stream = getClient().messages.stream(
          {
            model: CHAT_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            // This cache_control marker is INERT on this model today, and
            // deliberately kept. Haiku 4.5's minimum cacheable prefix is
            // 4096 tokens and SYSTEM_PROMPT does not reach it, so nothing is
            // ever cached. Confirmed live: cache_read_input_tokens was 0 on
            // every request of the first real API pass. The failure is silent
            // by design, which is why it took a live run to see. Retained
            // because it costs nothing and starts working the moment the
            // prompt grows past 4096 or the model changes. See spec section 7.
            system: [
              { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
            ],
            messages: conversation,
          },
          { signal: abort.signal },
        );

        stream.on('text', (delta) => {
          if (guardTrip) return;
          answer += delta;

          // Scan BEFORE forwarding, so the delta completing a violating
          // phrase never reaches the visitor. Earlier deltas are already
          // sent; the answer is left truncated, which is the point.
          guardTrip = scanAnswer(answer);
          if (guardTrip) {
            abort.abort();
            return;
          }

          send('delta', { text: delta });
        });

        let final: Anthropic.Message | undefined;
        try {
          final = await stream.finalMessage();
        } catch (error) {
          // Our own abort above, not a failure. Anything else is real.
          if (!guardTrip) throw error;
        }

        if (final) {
          // cacheRead is expected to be 0 on this model — see the note on
          // cache_control above. It is still logged, because a non-zero value
          // is exactly the signal that the prompt has grown past Haiku 4.5's
          // 4096-token threshold and caching has started working.
          console.info('[chat] turn complete', {
            cacheRead: final.usage.cache_read_input_tokens,
            output: final.usage.output_tokens,
            stopReason: final.stop_reason,
          });
        }

        /**
         * Reported BEFORE any error event, and that order is load-bearing: the
         * widget stops reading the stream the moment it sees `error`, so a lead
         * result sent afterwards would never be read and the visitor would
         * never learn their details had not reached anyone.
         */
        if (delivery) {
          send('lead', await delivery);
        } else if (leadBlocked) {
          // Rate-limited rather than attempted. Still reported: a visitor told
          // nothing would assume their details had gone through.
          send('lead', { ok: false });
        }

        if (guardTrip) {
          // No visitor text and no answer text — the fact and the pattern.
          console.warn('[chat] output guard tripped', { pattern: guardTrip });
          send('error', { message: GUARD_MESSAGE });
        }

        send('done', {});
      } catch (error) {
        // A client disconnect surfaces here as an abort — not a failure worth logging.
        if (!abort.signal.aborted) {
          const { message, log } = describeFailure(error);
          console.error('[chat] stream failed:', log);
          send('error', { message });
        }
      } finally {
        // After a consumer-initiated cancel() the stream is already closed and
        // this throws TypeError: Invalid state. Nothing is left to do at that
        // point, so swallow it rather than letting it surface as noise.
        try {
          controller.close();
        } catch {
          /* already closed by cancel() */
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(responseBody, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
