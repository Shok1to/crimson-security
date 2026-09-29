import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_MODEL, ANALYSIS_MAX_TOKENS, ANALYSIS_TIMEOUT_MS } from '@/lib/chat-config';
import { services } from '@/lib/content';
import type { ChatTurn } from '@/lib/enquiry-delivery';

/**
 * Reads an incoming enquiry and writes the team a briefing: what the visitor
 * wants, which service it points at, what is still unknown, and a reply they
 * can edit and send.
 *
 * Everything here is ADVISORY. It runs on the enquiry's own words and nothing
 * else, and the email that carries it labels it as machine-written and
 * unverified. It must never become the reason a fact is believed.
 *
 * It never throws. An enquiry reaching the team late or unanalysed is a small
 * problem; an enquiry not reaching them at all is the bug issue #1 was filed
 * for, and analysis must not be able to cause it.
 */

/** Same values `interest` already takes elsewhere, so the CRM sees one vocabulary. */
const INTEREST_VALUES: readonly string[] = [...services.map((s) => s.title), 'general'];

export type Urgency = 'high' | 'medium' | 'low' | 'unclear';

export interface LeadAnalysis {
  summary: string;
  interest: string;
  urgency: Urgency;
  /** What the enquiry actually evidences — never inferred beyond it. */
  signals: string[];
  /** What the team still needs to find out before they can scope anything. */
  unknowns: string[];
  suggestedNextStep: string;
  /** A draft the team edits and sends. Never sent automatically. */
  reply: string;
}

const analysisTool: Anthropic.Tool = {
  name: 'record_analysis',
  description: 'Record the briefing for the Crimson Security team.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'Two or three sentences: who this is and what they appear to want. Only what the enquiry says.',
      },
      interest: {
        type: 'string',
        enum: [...INTEREST_VALUES],
        description: 'Closest matching service, or "general" when it is genuinely unclear.',
      },
      urgency: {
        type: 'string',
        enum: ['high', 'medium', 'low', 'unclear'],
        description:
          'How time-pressured they appear, judged only on what they said. Use "unclear" freely — it is the honest answer most of the time.',
      },
      signals: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Short phrases quoting or closely paraphrasing what the enquiry evidences. No inference about budget, size or authority.',
      },
      unknowns: {
        type: 'array',
        items: { type: 'string' },
        description: 'What the team still needs to ask before they could scope this.',
      },
      suggested_next_step: {
        type: 'string',
        description: 'One concrete action for the team. One sentence.',
      },
      reply: {
        type: 'string',
        description:
          'A complete draft reply to the visitor, plain text, ready for a human to edit and send.',
      },
    },
    required: ['summary', 'interest', 'urgency', 'signals', 'unknowns', 'suggested_next_step', 'reply'],
    additionalProperties: false,
  },
};

/**
 * The rules are the chat assistant's, narrowed to writing. The draft goes to a
 * prospect over email, where a stray promise is a written record rather than a
 * chat bubble — so the prohibitions matter more here, not less.
 */
const SYSTEM = `You brief the Crimson Security team on enquiries that arrive through their website, and draft a reply they can edit and send.

Crimson Security is a Canadian information security firm. Its services are: ${INTEREST_VALUES.slice(0, -1).join(', ')}.

Work only from the enquiry you are given. Never invent a detail, a company size, a budget, a deadline or a motive that is not there. If something is unknown, that is what the unknowns list is for. Guessing costs the team more than a short briefing does.

Do not assess whether the visitor is worth talking to, and do not score them. Report what they said and what is missing. The team decides who is worth their time.

THE DRAFT REPLY

Write it as a colleague at Crimson would: plain, direct, no marketing voice. Address them by the name they gave. Acknowledge what they asked, say what Crimson does that bears on it, and propose one concrete next step, normally a short call.

It must never state a price, a timeline, an SLA, team size or a client name. It must never claim that engaging Crimson makes anyone compliant with any framework; Crimson assesses against frameworks, which is a different claim. It must never commit Crimson to doing a piece of work, meeting a requirement, or taking something on — that is the team's to decide, not yours.

Do not answer technical questions about the visitor's own environment, and do not repeat back any technical detail they volunteered. If they included any, say the team will pick it up with them directly through a secure channel.

End with a sign-off line of exactly "— The Crimson Security team" so whoever sends it can replace it with their own name.

Plain prose only. No markdown, no bullet characters, no headings. Keep it under 150 words.`;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

function renderEnquiry(input: {
  source: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interest?: string;
  message: string;
  transcript?: ChatTurn[];
}): string {
  const lines = [
    `Arrived through: ${input.source === 'chat' ? 'the website assistant' : 'the contact form'}`,
    `Name: ${input.name}`,
    input.email ? `Email: ${input.email}` : null,
    input.phone ? `Phone: ${input.phone}` : null,
    input.company ? `Company: ${input.company}` : null,
    input.interest ? `Stated interest: ${input.interest}` : null,
    '',
    'What they wrote:',
    input.message,
  ].filter((l): l is string => l !== null);

  if (input.transcript?.length) {
    lines.push('', 'Full conversation:');
    for (const turn of input.transcript) {
      lines.push(`${turn.role === 'user' ? 'Visitor' : 'Assistant'}: ${turn.content}`);
    }
  }

  return lines.join('\n');
}

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const strList = (value: unknown, maxItems: number, maxChars: number) =>
  Array.isArray(value)
    ? value
        .map((v) => str(v, maxChars))
        .filter((v) => v.length > 0)
        .slice(0, maxItems)
    : [];

const URGENCIES: readonly Urgency[] = ['high', 'medium', 'low', 'unclear'];

/**
 * Returns null on anything at all — no key, a timeout, a refusal, a malformed
 * tool call. The caller sends the enquiry either way.
 */
export async function analyseLead(
  input: Parameters<typeof renderEnquiry>[0],
): Promise<LeadAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const message = await getClient().messages.create(
      {
        model: ANALYSIS_MODEL,
        max_tokens: ANALYSIS_MAX_TOKENS,
        system: SYSTEM,
        tools: [analysisTool],
        // Forced, so the reply is always the structured call rather than prose
        // we would then have to parse.
        tool_choice: { type: 'tool', name: analysisTool.name },
        messages: [{ role: 'user', content: renderEnquiry(input) }],
      },
      // Bounded: the visitor is waiting on the contact form's response, and a
      // slow analysis must not hold the enquiry hostage.
      { signal: AbortSignal.timeout(ANALYSIS_TIMEOUT_MS) },
    );

    const block = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === analysisTool.name,
    );
    if (!block) return null;

    const raw = block.input as Record<string, unknown>;
    const summary = str(raw.summary, 1200);
    const reply = str(raw.reply, 3000);

    // The two fields the email is worth sending for. Without them there is
    // nothing to show, and a half-empty analysis block is worse than none.
    if (!summary || !reply) return null;

    const claimedInterest = str(raw.interest, 120);
    const claimedUrgency = str(raw.urgency, 20) as Urgency;

    return {
      summary,
      // The enum is a strong hint to the model, not a boundary. An
      // unrecognised value degrades to 'general' rather than reaching the CRM.
      interest: INTEREST_VALUES.includes(claimedInterest) ? claimedInterest : 'general',
      urgency: URGENCIES.includes(claimedUrgency) ? claimedUrgency : 'unclear',
      signals: strList(raw.signals, 6, 200),
      unknowns: strList(raw.unknowns, 6, 200),
      suggestedNextStep: str(raw.suggested_next_step, 400),
      reply,
    };
  } catch (error) {
    console.error('[enquiry] analysis failed', error instanceof Error ? error.message : error);
    return null;
  }
}
