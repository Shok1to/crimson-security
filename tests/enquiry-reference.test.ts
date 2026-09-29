import { describe, it, expect } from 'vitest';
import { createReference, REFERENCE_PATTERN, REFERENCE_PREFIX } from '@/lib/enquiry-reference';

describe('createReference', () => {
  it('matches its own published pattern', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(createReference()).toMatch(REFERENCE_PATTERN);
    }
  });

  it('is prefixed so it is recognisable out of context', () => {
    expect(createReference().startsWith(REFERENCE_PREFIX)).toBe(true);
  });

  /**
   * Someone will read this down a phone line or copy it off a screen. I, L, O
   * and U are the characters that get mistyped when they do, so the alphabet
   * excludes them.
   */
  it('avoids the characters people confuse when reading a code aloud', () => {
    const body = Array.from({ length: 300 }, () => createReference().slice(REFERENCE_PREFIX.length)).join('');
    expect(body).not.toMatch(/[ILOU]/);
  });

  it('is uppercase and fixed length, so it is safe to compare directly', () => {
    const codes = Array.from({ length: 50 }, createReference);
    for (const code of codes) {
      expect(code).toBe(code.toUpperCase());
      expect(code).toHaveLength(REFERENCE_PREFIX.length + 6);
    }
  });

  /**
   * Not a security property — the reference identifies nothing and grants
   * nothing. It is about collisions: two serverless instances starting
   * together must not hand out the same code.
   */
  it('does not repeat across a large batch', () => {
    const codes = new Set(Array.from({ length: 5000 }, createReference));
    expect(codes.size).toBe(5000);
  });

  /**
   * 256 is not a multiple of the 32-character alphabet, so taking a raw byte
   * modulo it would favour the first 8 characters by 2:1. Rejection sampling
   * is what prevents that, and this is the test that would catch its removal.
   */
  it('distributes evenly across the alphabet rather than favouring its start', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 4000; i += 1) {
      for (const ch of createReference().slice(REFERENCE_PREFIX.length)) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }

    const frequencies = [...counts.values()];
    const expected = (4000 * 6) / 32;
    // A biased implementation would put the first 8 characters at roughly
    // double the rest; this bound is loose enough for chance and far tighter
    // than that.
    expect(Math.min(...frequencies)).toBeGreaterThan(expected * 0.7);
    expect(Math.max(...frequencies)).toBeLessThan(expected * 1.3);
  });
});
