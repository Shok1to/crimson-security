import { differentiators, services } from '@/lib/content';

/**
 * Opening suggestions for the chat panel, phrased as a visitor would ask them.
 * Each names the `lib/content.ts` entries it is grounded in, verified at module
 * load, so a renamed service fails the build rather than leaving a button the
 * assistant cannot answer. FOUR is load-bearing: at the chips' 44px floor, six
 * filled the scroll area and clipped. A fifth means re-measuring the panel,
 * which the count assertion in tests/quick-replies.test.ts exists to force.
 */
interface QuickReply {
  /** What the visitor sees and sends. */
  question: string;
  /** Titles in lib/content.ts that carry the facts to answer it. */
  grounding: readonly string[];
}

const QUICK_REPLY_SOURCE: readonly QuickReply[] = [
  {
    question: 'What does a penetration test involve?',
    grounding: ['Penetration Testing'],
  },
  {
    question: 'Can you help us get ready for a SOC audit?',
    grounding: ['SSAE 16 / SOC Audits', 'Remote Pre-Audit Preparation'],
  },
  {
    question: 'What is your No Limit Policy?',
    grounding: ['No Limit Policy'],
  },
  {
    question: 'Do you handle incident response and forensics?',
    grounding: ['Incident Response Services', 'Forensic Analysis Services'],
  },
];

const KNOWN_TITLES = new Set<string>([
  ...services.map((s) => s.title),
  ...differentiators.map((d) => d.title),
]);

for (const reply of QUICK_REPLY_SOURCE) {
  for (const title of reply.grounding) {
    if (!KNOWN_TITLES.has(title)) {
      throw new Error(
        `Quick reply "${reply.question}" is grounded in "${title}", which is no longer in lib/content.ts.`,
      );
    }
  }
}

export const QUICK_REPLIES: readonly string[] = QUICK_REPLY_SOURCE.map((r) => r.question);
