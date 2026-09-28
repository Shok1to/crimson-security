import { site } from '@/lib/site';

/**
 * A deterministic backstop under the pricing rule, scanned over the answer as
 * it streams.
 *
 * The bar for putting a guard here: it must be STRICTLY MORE RELIABLE than the
 * instruction it backs up. A false positive truncates a good answer mid
 * sentence in front of a visitor, which is worse than the thing being guarded
 * against — so a pattern that cannot beat the prompt does not belong in code.
 */

export type GuardPattern = 'currency';

/**
 * Currency amounts. Pricing is forbidden outright, and the only currency
 * figure anywhere in the content is the $100M+ ROI stat, which INCLUDE_STATS
 * keeps out of the prompt entirely — so an amount in the output means the
 * pricing rule has already failed. A symbol or code has to sit against a
 * digit: bare numbers, "PCI DSS 4.0" and "24/7" are none of our business.
 *
 * This one clears the bar by construction. There is no correct answer that
 * contains a currency figure, so the pattern cannot fight a right answer.
 */
const CURRENCY: readonly RegExp[] = [
  /[$€£¥]\s?\d/,
  /\b(?:USD|CAD|EUR|GBP|AUD)\s?\$?\s?\d/i,
  /\b\d[\d,.]*\s?(?:dollars?|euros?|pounds\s+sterling)\b/i,
];

/**
 * COMPLIANCE IS NOT GUARDED HERE, DELIBERATELY. Do not add it back.
 *
 * There was a compliance-assertion pattern. It was removed after it truncated
 * this, mid word, on a live request:
 *
 *   "First, Crimson assesses your controls against PCI — which is different
 *    from making you compliant."
 *
 * That is the assistant getting it exactly right, and the guard replaced it
 * with a generic fallback. The failure is structural, not a tuning miss. RULES
 * tells the assistant that Crimson "assesses against frameworks, which is a
 * different claim", so the prompt REQUIRES a contrastive phrasing, and every
 * correct compliance answer therefore puts "compliant" next to "you" inside a
 * qualifying clause. The guard was fighting the prompt, and it was least
 * accurate precisely where the answer was most valuable.
 *
 * Widening the negation check to contrastive forms does not fix it: "different
 * from", "not the same as", "rather than", "does not amount to", "a separate
 * matter to" is an open-ended set. Worse, every qualifier added to the
 * suppression list also suppresses the real assertion it was meant to catch,
 * so the conservative version converges on catching nothing at all — the same
 * recall as no pattern, with ongoing false-positive risk and upkeep.
 *
 * Observed record before removal: zero true positives, one false positive, on
 * an answer the prompt had already got right under direct pressure. The
 * compliance rule stays enforced by RULES and restated in REMINDERS, which is
 * where it demonstrably works.
 */

/**
 * Returns the pattern that tripped, or null. Called on every delta with the
 * answer so far, so it must stay cheap and must never throw.
 */
export function scanAnswer(answer: string): GuardPattern | null {
  for (const pattern of CURRENCY) {
    if (pattern.test(answer)) return 'currency';
  }
  return null;
}

/** What the visitor sees. Neutral, and it still offers a way forward. */
export const GUARD_MESSAGE = `Sorry — I can't help with that one here. Email ${site.emails.info} or use the contact form and the team will pick it up.`;
