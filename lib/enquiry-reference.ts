/**
 * A short reference carried by every enquiry, so a conversation in the chat
 * panel and the email it produced can be matched to each other.
 *
 * The visitor is shown it the moment their details are delivered, and it leads
 * the email subject. Someone who writes back quoting "CS-8F3K2Q" can be found
 * with one search.
 */

/**
 * Crockford's alphabet: no I, L, O or U. Those are the characters people
 * mistype when reading a code aloud down a phone line or copying it off a
 * screen, which is the whole situation this exists for.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Six characters is about 10^9 combinations — ample, and still readable aloud. */
const LENGTH = 6;

export const REFERENCE_PREFIX = 'CS-';

/** Matches what createReference produces. Exported so callers can validate. */
export const REFERENCE_PATTERN = new RegExp(`^${REFERENCE_PREFIX}[${ALPHABET}]{${LENGTH}}$`);

/**
 * Uses the crypto RNG rather than Math.random. Not because this is a secret —
 * it identifies nothing and grants nothing — but because Math.random is seeded
 * per process, and serverless instances that start together would hand out
 * colliding references.
 *
 * Rejection sampling keeps the distribution even: 256 is not a multiple of 32,
 * so taking a raw byte modulo the alphabet would favour its first 8 characters.
 */
export function createReference(): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';

  while (out.length < LENGTH) {
    const bytes = new Uint8Array(LENGTH);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (out.length === LENGTH) break;
      if (byte < limit) out += ALPHABET[byte % ALPHABET.length];
    }
  }

  return `${REFERENCE_PREFIX}${out}`;
}
