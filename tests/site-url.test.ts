import { describe, it, expect } from 'vitest';
import { resolveSiteUrl } from '@/lib/site';

const PRODUCTION = 'https://crimsonsecurityinc.ca';
const LOCAL = 'http://localhost:3000';

/**
 * Every canonical, og:url, sitemap entry and JSON-LD URL is built from this, and
 * getting it wrong fails silently — which is how the old Vercel-project-URL
 * fallback went unnoticed.
 */
describe('resolveSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL, so a staging deploy can point at itself', () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://staging.example.com', VERCEL: '1' }),
    ).toBe('https://staging.example.com');
  });

  it('falls back to the production domain on Vercel, not the project URL', () => {
    expect(resolveSiteUrl({ VERCEL: '1' })).toBe(PRODUCTION);
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'crimson-abc123.vercel.app' })).toBe(
      PRODUCTION,
    );
  });

  // The regression this replaced: the project URL must never reach a canonical.
  it('never returns a vercel.app host', () => {
    expect(
      resolveSiteUrl({ VERCEL: '1', VERCEL_PROJECT_PRODUCTION_URL: 'crimson-abc123.vercel.app' }),
    ).not.toContain('vercel.app');
  });

  it('falls back to localhost when not deployed', () => {
    expect(resolveSiteUrl({})).toBe(LOCAL);
  });

  /**
   * Six call sites concatenate onto this, so a trailing slash yields //privacy.
   * The natural way to write a domain includes one, so it is stripped rather
   * than trusted.
   */
  it('never returns a trailing slash', () => {
    for (const url of [
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://crimsonsecurityinc.ca/' }),
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://crimsonsecurityinc.ca///' }),
      resolveSiteUrl({ VERCEL: '1' }),
      resolveSiteUrl({}),
    ]) {
      expect(url).not.toMatch(/\/$/);
      expect(`${url}/privacy`).not.toContain('//privacy');
    }
  });

  // An unset variable can arrive as "" through some tooling, and "" is not
  // nullish, so a ?? fallback would have returned the empty string.
  it('treats a blank NEXT_PUBLIC_SITE_URL as unset', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '', VERCEL: '1' })).toBe(PRODUCTION);
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '   ', VERCEL: '1' })).toBe(PRODUCTION);
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '' })).toBe(LOCAL);
  });
});
