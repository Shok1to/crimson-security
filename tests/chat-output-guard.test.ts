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

  describe('compliance assertions about the visitor', () => {
    it.each([
      'Working with Crimson makes you compliant with PCI.',
      'After the assessment you are compliant.',
      'That engagement will make your organisation compliant.',
      'You will be compliant once the remediation is done.',
      'We guarantee compliance with SOC 2.',
      'An assessment ensures your compliance.',
      'That brings you into compliance with the standard.',
    ])('trips on %j', (answer) => {
      expect(scanAnswer(answer)).toBe('compliance-assertion');
    });

    /**
     * Real sentences from the live pass. The second is the REFUSAL the prompt
     * asks for and contains "compliant" verbatim — a careless pattern kills
     * exactly the sentence the rules exist to produce.
     */
    it.each([
      'Crimson assesses your controls against PCI and delivers a report that shows where you stand',
      "engaging Crimson doesn't make you compliant",
      'Engaging Crimson will not make you compliant with a framework.',
      'An assessment shows where you stand; it does not make you compliant.',
      'Crimson never claims that an assessment makes you compliant.',
      'We provide compliance assessments and reports.',
      'Compliance assessments are one of the eight services.',
      'Crimson assesses against frameworks, which is a different claim.',
      'No assessment can make you compliant on its own.',
    ])('leaves %j alone', (answer) => {
      expect(scanAnswer(answer)).toBeNull();
    });

    // The negation must belong to the same clause, or a later disclaimer could
    // launder an assertion made earlier in the answer.
    it('does not let a later sentence cancel an earlier assertion', () => {
      const answer = 'Working with Crimson makes you compliant. That is not a guarantee.';
      expect(scanAnswer(answer)).toBe('compliance-assertion');
    });
  });

  it('returns null for an empty or ordinary answer', () => {
    expect(scanAnswer('')).toBeNull();
    expect(scanAnswer('Crimson Security is a Canadian cybersecurity firm.')).toBeNull();
  });

  // The scan runs on every delta with the answer so far, so a phrase split
  // across deltas must still be caught once it is complete.
  it('catches a phrase that arrives split across deltas', () => {
    const deltas = ['Working ', 'with Crimson ', 'makes you ', 'compliant', ' with PCI.'];
    let answer = '';
    const trips: (string | null)[] = [];
    for (const delta of deltas) {
      answer += delta;
      trips.push(scanAnswer(answer));
    }
    expect(trips.slice(0, 3)).toEqual([null, null, null]);
    expect(trips[3]).toBe('compliance-assertion');
  });
});

describe('GUARD_MESSAGE', () => {
  it('offers the contact route without explaining what tripped', () => {
    expect(GUARD_MESSAGE).toContain(site.emails.info);
    expect(GUARD_MESSAGE).toMatch(/contact form/i);
    expect(GUARD_MESSAGE).not.toMatch(/guard|pattern|pricing|complian/i);
  });
});
