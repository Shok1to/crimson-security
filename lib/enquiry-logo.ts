/**
 * The brand mark, embedded in the message rather than hotlinked.
 *
 * A remote <img> fails in three situations that all matter here: a client that
 * blocks remote images (the default in many), a send from a local or preview
 * environment where site.url is not publicly reachable, and any moment before
 * the asset has actually been deployed. Embedding removes all three.
 *
 * Held as a constant rather than read from public/ at send time: files under
 * public/ are served statically but are not reliably present in a serverless
 * function's own filesystem, so reading it at runtime would work locally and
 * fail in production -- the worst possible split.
 *
 * Source: public/crimson-security-mark-email.png, 60x60. Regenerate both
 * together if the mark changes.
 */
export const LOGO_CONTENT_ID = 'crimson-mark';
export const LOGO_FILENAME = 'crimson-security.png';

/** Base64 PNG, 6399 bytes decoded. */
export const LOGO_BASE64 =
  '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' +
  'QmCC';
