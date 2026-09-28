import { site } from '@/lib/site';

/**
 * A deterministic backstop under two prompt rules, scanned over the answer as
 * it streams.
 *
 * Everything else guarding this endpoint is an instruction, and instructions
 * are probabilistic. These two slips are the highest-liability and the
 * cheapest to catch in code, so they get a second line of defence.
 *
 * PRECISION OVER RECALL, deliberately. A false positive truncates a good
 * answer mid-sentence in front of a visitor, which is worse than the thing
 * being guarded against. Anything doubtful is left to the prompt.
 */

export type GuardPattern = 'currency' | 'compliance-assertion';

/**
 * Currency amounts. Pricing is forbidden outright, and the only currency
 * figure anywhere in the content is the $100M+ ROI stat, which INCLUDE_STATS
 * keeps out of the prompt entirely — so an amount in the output means the
 * pricing rule has already failed. A symbol or code has to sit against a
 * digit: bare numbers, "PCI DSS 4.0" and "24/7" are none of our business.
 */
const CURRENCY: readonly RegExp[] = [
  /[$€£¥]\s?\d/,
  /\b(?:USD|CAD|EUR|GBP|AUD)\s?\$?\s?\d/i,
  /\b\d[\d,.]*\s?(?:dollars?|euros?|pounds\s+sterling)\b/i,
];

/**
 * Assertions that the visitor is, will be, or has been made compliant.
 *
 * Narrow on purpose. "Compliance assessments", "assesses against PCI" and
 * "PCI DSS 4.0" must all pass: the assistant is free to describe the work. Only
 * a claim about the visitor's own compliance state trips this.
 */
const COMPLIANCE: readonly RegExp[] = [
  /\b(?:make|makes|making|made)\s+(?:you|your\s+\w+(?:\s+\w+)?)\s+compliant\b/i,
  /\b(?:you|your\s+\w+)\s+(?:are|is|will\s+be|'ll\s+be|would\s+be|becomes?)\s+(?:then\s+|fully\s+|automatically\s+)?compliant\b/i,
  /\b(?:guarantee|guarantees|guaranteed|ensure|ensures|ensuring)\s+(?:your\s+)?compliance\b/i,
  /\bbrings?\s+you\s+into\s+compliance\b/i,
];

/**
 * The sentence the assistant is MOST likely to write about compliance is the
 * correct refusal — "engaging Crimson doesn't make you compliant". It contains
 * the offending phrase verbatim, so a pattern alone would kill the very
 * sentence the prompt asks for. Only the clause before the match is searched,
 * so a later sentence cannot cancel an assertion made earlier.
 */
const NEGATED = /\b(?:not|never|cannot|can't|won't|doesn't|don't|isn't|aren't|no)\b|n't\b/i;

function clauseBefore(text: string, index: number): string {
  const start = Math.max(
    text.lastIndexOf('.', index - 1),
    text.lastIndexOf('!', index - 1),
    text.lastIndexOf('?', index - 1),
    text.lastIndexOf(';', index - 1),
    text.lastIndexOf('\n', index - 1),
  );
  return text.slice(start + 1, index);
}

/**
 * Returns the pattern that tripped, or null. Called on every delta with the
 * answer so far, so it must stay cheap and must never throw.
 */
export function scanAnswer(answer: string): GuardPattern | null {
  for (const pattern of CURRENCY) {
    if (pattern.test(answer)) return 'currency';
  }

  for (const pattern of COMPLIANCE) {
    const match = pattern.exec(answer);
    if (match && !NEGATED.test(clauseBefore(answer, match.index))) {
      return 'compliance-assertion';
    }
  }

  return null;
}

/** What the visitor sees. Neutral, and it still offers a way forward. */
export const GUARD_MESSAGE =
  `Sorry — I can't help with that one here. Email ${site.emails.info} or use the contact form and the team will pick it up.`;
