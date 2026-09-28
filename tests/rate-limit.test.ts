import { describe, it, expect, vi, afterEach } from 'vitest';
import { createInMemoryRateLimiter, clientKeyFromHeaders } from '@/lib/rate-limit';

afterEach(() => vi.useRealTimers());

describe('createInMemoryRateLimiter', () => {
  it('allows requests up to the limit', async () => {
    const limiter = createInMemoryRateLimiter(3, 60_000);
    expect((await limiter.check('a')).ok).toBe(true);
    expect((await limiter.check('a')).ok).toBe(true);
    expect((await limiter.check('a')).ok).toBe(true);
  });

  it('blocks the request past the limit and reports a retry delay', async () => {
    const limiter = createInMemoryRateLimiter(2, 60_000);
    await limiter.check('a');
    await limiter.check('a');
    const result = await limiter.check('a');
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('keeps separate counts per key', async () => {
    const limiter = createInMemoryRateLimiter(1, 60_000);
    expect((await limiter.check('a')).ok).toBe(true);
    expect((await limiter.check('b')).ok).toBe(true);
    expect((await limiter.check('a')).ok).toBe(false);
  });

  it('allows again once the window expires', async () => {
    vi.useFakeTimers();
    const limiter = createInMemoryRateLimiter(1, 60_000);
    expect((await limiter.check('a')).ok).toBe(true);
    expect((await limiter.check('a')).ok).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect((await limiter.check('a')).ok).toBe(true);
  });

  // Spec section 6: the interface is the swap point for a Redis implementation,
  // which cannot drop in unless callers already await. Pin the contract.
  it('returns a promise so an async implementation can replace it', () => {
    const limiter = createInMemoryRateLimiter(1, 60_000);
    expect(limiter.check('a')).toBeInstanceOf(Promise);
  });
});

describe('clientKeyFromHeaders', () => {
  // Review Focus 1: a proxy chain must collapse to the originating client.
  it('takes the first address from an x-forwarded-for chain', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.9, 70.41.3.18, 150.172.238.178' });
    expect(clientKeyFromHeaders(headers)).toBe('203.0.113.9');
  });

  it('trims whitespace around a single address', () => {
    expect(clientKeyFromHeaders(new Headers({ 'x-forwarded-for': '  203.0.113.9  ' }))).toBe('203.0.113.9');
  });

  // Review Focus 2: no header must not collapse every visitor into one bucket
  // by accident — but it must still return a usable, stable key.
  it('falls back to a sentinel when the header is absent', () => {
    expect(clientKeyFromHeaders(new Headers())).toBe('unknown');
  });

  it('falls back to a sentinel when the header is empty', () => {
    expect(clientKeyFromHeaders(new Headers({ 'x-forwarded-for': '   ' }))).toBe('unknown');
  });
});
