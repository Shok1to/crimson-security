import { describe, it, expect } from 'vitest';
import { scanAnswer, GUARD_MESSAGE } from '@/lib/chat-output-guard';
import { site } from '@/lib/site';

/**
 * Both directions matter, and the negative direction matters more: a false
 * positive truncates a good answer mid-sentence in front of a visitor.
 */
describe('scanAnswer', () => {
  describe('currency', () => {
    it.each([
      'A penetration test starts at $5,000.',
      'Expect around $12k for that scope.',
      'That would be about 5,000 dollars.',
      'Roughly CAD 8,000 depending on scope.',
      'It is £4,500 for the engagement.',
      'Typically €3.000 per assessment.',
      'We charge USD 250 an hour.',
    ])('trips on %j', (answer) => {
      expect(scanAnswer(answer)).toBe('currency');
    });

    // Bare numbers, framework versions and the site's own figures are not
    // prices and must survive.
    it.each([
      'Crimson assesses against PCI DSS 4.0 and SOC 2.',
      'Support runs Monday to Friday, 9am to 5pm.',
      'Availability is 24/7 for incident response.',
      'There are eight services, covering assessment through to response.',
      'ISO 27001 and NIST 800-53 are both in scope for an assessment.',
      'The report has two levels, one for executives and one for IT.',
      'We have 18 years of experience across those verticals.',
    ])('leaves %j alone', (answer) => {
      expect(scanAnswer(answer)).toBeNull();
    });
  });

  /**
   * The guard does not look at compliance at all any more, and these cases
   * exist to keep it that way. A compliance-assertion pattern shipped, then
   * truncated a CORRECT answer on a live request, because the prompt itself
   * requires the contrastive phrasing that tripped it. See the long note in
   * lib/chat-output-guard.ts before reaching for one again.
   */
  describe('compliance is left to the prompt', () => {
    // The exact answer the removed pattern cut off, mid-word, in production.
    it('does not touch the live regression that caused the removal', () => {
      const answer =
        'First, Crimson assesses your controls against PCI — which is different from making you compliant.';
      expect(scanAnswer(answer)).toBeNull();
    });

    // Contrastive constructions carry the negation with no negator in them,
    // which is what made the pattern unfixable by widening. Note the em dash:
    // the assistant writes them, so any clause splitting has to survive one.
    it.each([
      'Crimson assesses your controls against PCI — which is different from making you compliant.',
      'An assessment is not the same as making you compliant.',
      'We assess against the framework rather than making you compliant.',
      'You get a report showing where you stand — that does not mean you are compliant.',
      'That work does not amount to making you compliant.',
      'Certification is a separate matter to the assessment itself.',
    ])('leaves the contrastive form %j alone', (answer) => {
      expect(scanAnswer(answer)).toBeNull();
    });

    // The plain refusals the prompt asks for, which contain the phrase verbatim.
    it.each([
      "engaging Crimson doesn't make you compliant",
      'Engaging Crimson will not make you compliant with a framework.',
      'An assessment shows where you stand; it does not make you compliant.',
      'Crimson never claims that an assessment makes you compliant.',
      'No assessment can make you compliant on its own.',
    ])('leaves the refusal %j alone', (answer) => {
      expect(scanAnswer(answer)).toBeNull();
    });

    // Describing the work, which must always have been fine.
    it.each([
      'Crimson assesses your controls against PCI and delivers a report that shows where you stand',
      'We provide compliance assessments and reports.',
      'Compliance assessments are one of the eight services.',
      'Crimson assesses against frameworks, which is a different claim.',
    ])('leaves %j alone', (answer) => {
      expect(scanAnswer(answer)).toBeNull();
    });

    /**
     * Recording the cost of the decision honestly: a bare assertion is NOT
     * caught in code. That is accepted, not overlooked — RULES forbids it and
     * REMINDERS restates it, and the live pass showed the prompt holding under
     * direct pressure, which the guard did not.
     */
    it.each([
      'Working with Crimson makes you compliant with PCI.',
      'After the assessment you are compliant.',
      'We guarantee compliance with SOC 2.',
    ])('deliberately does not catch the bare assertion %j', (answer) => {
      expect(scanAnswer(answer)).toBeNull();
    });
  });

  it('returns null for an empty or ordinary answer', () => {
    expect(scanAnswer('')).toBeNull();
    expect(scanAnswer('Crimson Security is a Canadian cybersecurity firm.')).toBeNull();
  });

  // The scan runs on every delta with the answer so far, so a figure split
  // across deltas must still be caught once it is complete.
  it('catches a figure that arrives split across deltas', () => {
    const deltas = ['A penetration ', 'test starts ', 'at ', '$5,000', '.'];
    let answer = '';
    const trips: (string | null)[] = [];
    for (const delta of deltas) {
      answer += delta;
      trips.push(scanAnswer(answer));
    }
    expect(trips.slice(0, 3)).toEqual([null, null, null]);
    expect(trips[3]).toBe('currency');
  });
});

describe('GUARD_MESSAGE', () => {
  it('offers the contact route without explaining what tripped', () => {
    expect(GUARD_MESSAGE).toContain(site.emails.info);
    expect(GUARD_MESSAGE).toMatch(/contact form/i);
    expect(GUARD_MESSAGE).not.toMatch(/guard|pattern|pricing|complian/i);
  });
});
