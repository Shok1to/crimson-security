import { differentiators, services } from '@/lib/content';

/**
 * Opening suggestions for the chat panel — a way in for a visitor who would
 * rather tap than type, which matters most on a phone.
 *
 * Each one names the entry in `lib/content.ts` it is grounded in, and that
 * entry is verified to still exist when this module loads.
 * `lib/chat-knowledge.ts` builds the system prompt from the same modules, so a
 * suggestion can only ask something the assistant actually has the facts to
 * answer. Rename a service and this throws at build time rather than quietly
 * leaving a button that invites "I don't have that detail".
 *
 * Questions are phrased the way a visitor would ask them, not the way the site
 * labels things.
 *
 * FOUR, and the count is load-bearing. Once the chips reached their 44px
 * accessibility floor, six of them ran to 320px — three quarters of the
 * visible scroll area — and the last one was clipped on first open, so the
 * greeting was crowded and the visitor met a wall of buttons. 44px is a floor,
 * not a preference, so the count gives way instead: two single-service
 * openers, one spanning two services, and the most distinctive policy. Adding
 * a fifth means re-measuring the panel, which is what the count assertion in
 * tests/quick-replies.test.ts is there to force.
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
