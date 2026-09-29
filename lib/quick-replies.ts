import { differentiators, services } from '@/lib/content';

/**
 * Suggested questions, in a PROSPECT'S voice.
 *
 * Phrased the way someone evaluating Crimson would ask, not the way the site
 * labels things. A visitor does not arrive knowing the phrase "No Limit Policy"
 * or that forensics is a separate service line; they arrive with a worry.
 *
 * ONE SOURCE, TWO SURFACES. The full set is the lightbulb menu, which is a
 * dedicated surface where scrolling is expected. The four marked `opening` are
 * also shown in the greeting, where space is tight: four chips measure 217px
 * against a 424px scroll area and six measured 320px with the last one clipped.
 * The greeting set is a subset by construction rather than a second list, so a
 * visitor cannot meet a question in the menu that contradicts one in the
 * greeting.
 *
 * Each entry names the `lib/content.ts` titles it relies on, checked at module
 * load and therefore at build: rename a service and this throws rather than
 * leaving a button that invites "I don't have that detail".
 */
interface Suggestion {
  /** What the visitor sees and sends. */
  question: string;
  /** Titles in lib/content.ts that carry the facts to answer it. */
  grounding: readonly string[];
  /** Also shown in the greeting. Exactly OPENING_COUNT entries carry this. */
  opening?: true;
}

/** Pinned so a fifth greeting chip is a decision, not an accident. */
const OPENING_COUNT = 4;

const SUGGESTIONS: readonly Suggestion[] = [
  {
    question: 'What happens during a penetration test?',
    grounding: ['Penetration Testing'],
    opening: true,
  },
  {
    question: 'Can you help us get ready for a SOC audit?',
    grounding: ['SSAE 16 / SOC Audits', 'Remote Pre-Audit Preparation'],
    opening: true,
  },
  {
    question: 'Which compliance frameworks do you assess against?',
    grounding: ['Compliance Assessments & Reports'],
  },
  {
    // Was "What is your No Limit Policy?" — Crimson's label for it, which a
    // visitor has no reason to know. This asks the underlying worry instead.
    question: 'Is there a limit on how many devices you test?',
    grounding: ['No Limit Policy'],
    opening: true,
  },
  {
    question: 'Who will actually be doing the work?',
    grounding: ['No Hacker Policy', 'Owner Accessibility'],
  },
  {
    // Remediation Assistance and Detailed Reporting are two of the firm's
    // strongest differentiators and no suggestion reached either of them.
    question: 'Do you help fix what you find, or just report it?',
    grounding: ['Remediation Assistance', 'Detailed Reporting'],
  },
  {
    question: 'Can you assess our vendors too?',
    grounding: ['Vendor Security Management'],
  },
  {
    // Was "Do you handle incident response and forensics?" — the two service
    // names. Someone with this problem asks about the problem.
    question: "What do you do if we've had a breach?",
    grounding: ['Incident Response Services', 'Forensic Analysis Services'],
    opening: true,
  },
];

const KNOWN_TITLES = new Set<string>([
  ...services.map((s) => s.title),
  ...differentiators.map((d) => d.title),
]);

for (const suggestion of SUGGESTIONS) {
  for (const title of suggestion.grounding) {
    if (!KNOWN_TITLES.has(title)) {
      throw new Error(
        `Suggested question "${suggestion.question}" is grounded in "${title}", which is no longer in lib/content.ts.`,
      );
    }
  }
}

const opening = SUGGESTIONS.filter((s) => s.opening);
if (opening.length !== OPENING_COUNT) {
  throw new Error(
    `Expected exactly ${OPENING_COUNT} opening suggestions, found ${opening.length}. The greeting has room for four; see the note above.`,
  );
}

/** Every question. The lightbulb menu, which may scroll. */
export const QUICK_REPLIES: readonly string[] = SUGGESTIONS.map((s) => s.question);

/** The subset shown in the greeting, where space is tight. */
export const OPENING_QUICK_REPLIES: readonly string[] = opening.map((s) => s.question);
