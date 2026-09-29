import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { metadata } from '@/app/privacy/page';
import { site, socialImageAlt } from '@/lib/site';

const repoFile = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');

/**
 * The privacy page had no openGraph block, so the root layout's values passed
 * through and a link to it previewed as the home page and linked there, while
 * its canonical said /privacy.
 */
describe('privacy page social metadata', () => {
  const og = metadata.openGraph;
  const twitter = metadata.twitter;

  it('declares its own canonical and openGraph url, and they agree', () => {
    expect(metadata.alternates?.canonical).toBe('/privacy');
    expect(og).toBeDefined();
    expect(og && 'url' in og ? og.url : undefined).toBe('/privacy');
  });

  it('describes itself rather than the home page', () => {
    const title = og && 'title' in og ? og.title : undefined;
    expect(title).toContain('Privacy Policy');
    expect(title).not.toBe(`${site.name} — ${site.tagline}`);
  });

  /**
   * Declaring openGraph replaces the parent block entirely AND suppresses the
   * inherited file-convention image, so every field has to be restated. An
   * earlier version of this page set only title, description and url and
   * silently dropped all four of these from the built output.
   */
  it('restates the fields that declaring the block would otherwise drop', () => {
    expect(og && 'type' in og ? og.type : undefined).toBe('website');
    expect(og && 'locale' in og ? og.locale : undefined).toBe('en_CA');
    expect(og && 'siteName' in og ? og.siteName : undefined).toBe(site.name);
    expect(og && 'images' in og ? og.images : undefined).toBeDefined();
  });

  // twitter does not fall back to openGraph; it inherited the root's block and
  // kept carrying the home page's title until it was declared here too.
  it('declares its own twitter card', () => {
    expect(twitter).toBeDefined();
    const title = twitter && 'title' in twitter ? twitter.title : undefined;
    expect(title).toContain('Privacy Policy');
    expect(twitter && 'card' in twitter ? twitter.card : undefined).toBe('summary_large_image');
    expect(twitter && 'images' in twitter ? twitter.images : undefined).toBeDefined();
  });
});

/**
 * The root layout takes the alt text from the file convention while any page
 * declaring its own block takes it from the constant. Two sources, so this
 * pins them together rather than trusting a comment.
 */
describe('socialImageAlt', () => {
  it.each(['app/opengraph-image.alt.txt', 'app/twitter-image.alt.txt'])(
    'matches %s byte for byte',
    (path) => {
      expect(repoFile(path).trim()).toBe(socialImageAlt);
    },
  );
});
