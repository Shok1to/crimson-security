import { differentiators, services } from '@/lib/content';

/**
 * Opening suggestions for the chat panel — a way in for a visitor who would
 * rather tap than type, which matters most on a phone.
 *
 * Each one names the entry in `lib/content.ts` (or `lib/site.ts`) it is
 * grounded in, and that entry is verified to still exist when this module
 * loads. `lib/chat-knowledge.ts` builds the system prompt from the same
 * modules, so a suggestion can only ask something the assistant actually has
 * the facts to answer. Rename a service and this throws at build time rather
 * than quietly leaving a button that invites "I don't have that detail".
 *
 * Questions are phrased the way a visitor would ask them, not the way the site
 * labels things. Keep the list short — it is a starting affordance, not a menu.
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
    question: 'What certifications do your technicians hold?',
    grounding: ['No Hacker Policy'],
  },
  {
    question: 'Do you handle incident response and forensics?',
    grounding: ['Incident Response Services', 'Forensic Analysis Services'],
  },
  {
    // Answered from the knowledge base's CONTACT block, which is built from
    // site.address and site.locations — both non-optional literals in
    // lib/site.ts, so there is no content title to pin.
    question: 'Where in Canada are you based?',
    grounding: [],
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
