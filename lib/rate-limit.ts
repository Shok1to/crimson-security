import {
  LEAD_RATE_LIMIT_MAX,
  LEAD_RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from '@/lib/chat-config';

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

/**
 * Spec section 6 defines this as async on purpose. The in-memory
 * implementation needs no I/O, but a Redis-backed one does — and the whole
 * point of the interface is that swapping it means writing a second
 * implementation and changing one import, with no route changes. A synchronous
 * signature would force every call site to be edited on the way to Redis,
 * which is exactly the escape hatch this interface exists to provide.
 */
export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window counter in this instance's memory.
 *
 * Deliberate trade-off (spec section 6): state is per-instance, so the real
 * limit is `max x instance count`. It stops a casual script, not a determined
 * attacker — the payload caps and CHAT_ENABLED are what bound the damage. The
 * interface is the swap point; Redis drops in without touching the routes.
 */
export function createInMemoryRateLimiter(
  max: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): RateLimiter {
  const windows = new Map<string, Window>();

  return {
    // Async to satisfy the interface; the body below does no I/O and never
    // yields, so counting stays atomic with respect to concurrent callers.
    async check(key: string): Promise<RateLimitResult> {
      const now = Date.now();

      // Sweep on write so the map cannot grow without bound.
      for (const [k, w] of windows) {
        if (w.resetAt <= now) windows.delete(k);
      }

      const existing = windows.get(key);
      if (!existing) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true };
      }

      if (existing.count < max) {
        existing.count += 1;
        return { ok: true };
      }

      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    },
  };
}

/**
 * Vercel sets x-forwarded-for. It may carry a proxy chain — the originating
 * client is the first entry. Taking the whole header would give every distinct
 * chain its own bucket, so the limit would never bind.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}

export const rateLimiter = createInMemoryRateLimiter();

/**
 * Separate instance, separate window. Kept apart from `rateLimiter` on purpose:
 * sending an email is not the same act as asking a question, and sharing a
 * budget would let a burst of harmless questions exhaust the protection that
 * actually matters.
 */
export const leadLimiter = createInMemoryRateLimiter(
  LEAD_RATE_LIMIT_MAX,
  LEAD_RATE_LIMIT_WINDOW_MS,
);
