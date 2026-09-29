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

/** Base64 PNG, 6605 bytes decoded. */
export const LOGO_BASE64 =
  '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' +
  'RK5CYII=';
