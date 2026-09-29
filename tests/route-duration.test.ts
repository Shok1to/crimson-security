import { describe, it, expect } from 'vitest';
import { maxDuration as chatMaxDuration } from '@/app/api/chat/route';
import { maxDuration as contactMaxDuration } from '@/app/api/contact/route';
import { ANALYSIS_TIMEOUT_MS } from '@/lib/chat-config';

/**
 * The lead briefing is awaited BEFORE the enquiry email is sent. That ordering
 * is deliberate — one email carrying the enquiry and its briefing beats two —
 * but it means the function must outlive the analysis by a clear margin. A
 * function killed while a slow analysis is still running would never reach the
 * send, and the enquiry would vanish without anyone knowing: the exact silent
 * loss issue #1 was filed for.
 *
 * Neither route can import the value (Next requires route segment config to be
 * statically analysable), so nothing in the type system ties them together.
 * This file is that tie.
 */
describe('route maxDuration against the analysis timeout', () => {
  /**
   * Double, not merely greater: the margin has to cover the Resend round trip,
   * cold start and request parsing on top of the analysis itself.
   */
  const REQUIRED_MS = ANALYSIS_TIMEOUT_MS * 2;

  it.each([
    ['chat', chatMaxDuration],
    ['contact', contactMaxDuration],
  ])('the %s route declares one', (_name, value) => {
    // Absent means the platform default applies — 10s on some plans, which is
    // BELOW the analysis timeout. That is the bug this test exists to catch.
    expect(typeof value).toBe('number');
  });

  it.each([
    ['chat', chatMaxDuration],
    ['contact', contactMaxDuration],
  ])('the %s route outlives a worst-case analysis with room to send', (_name, value) => {
    expect(value * 1000).toBeGreaterThanOrEqual(REQUIRED_MS);
  });

  /**
   * Vercel caps maxDuration by plan. A value above the cap fails the deploy
   * rather than degrading, so this keeps the number inside what the lowest
   * paid tier allows.
   */
  it.each([
    ['chat', chatMaxDuration],
    ['contact', contactMaxDuration],
  ])('the %s route stays within a conservative platform ceiling', (_name, value) => {
    expect(value).toBeLessThanOrEqual(60);
  });
});
