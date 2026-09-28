import { describe, it, expect, vi, afterEach } from 'vitest';
import { createInMemoryRateLimiter, clientKeyFromHeaders } from '@/lib/rate-limit';

afterEach(() => vi.useRealTimers());

describe('createInMemoryRateLimiter', () => {
  it('allows requests up to the limit', () => {
    const limiter = createInMemoryRateLimiter(3, 60_000);
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(true);
  });

  it('blocks the request past the limit and reports a retry delay', () => {
    const limiter = createInMemoryRateLimiter(2, 60_000);
    limiter.check('a');
    limiter.check('a');
    const result = limiter.check('a');
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('keeps separate counts per key', () => {
    const limiter = createInMemoryRateLimiter(1, 60_000);
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('b').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(false);
  });

  it('allows again once the window expires', () => {
    vi.useFakeTimers();
    const limiter = createInMemoryRateLimiter(1, 60_000);
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(limiter.check('a').ok).toBe(true);
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
