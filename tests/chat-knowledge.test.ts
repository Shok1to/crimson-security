import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, INCLUDE_STATS } from '@/lib/chat-knowledge';
import { services, differentiators, stats } from '@/lib/content';
import { site } from '@/lib/site';

describe('buildSystemPrompt', () => {
  it('names every service from lib/content.ts', () => {
    const prompt = buildSystemPrompt();
    for (const service of services) {
      expect(prompt).toContain(service.title);
    }
  });

  it('names every differentiator', () => {
    const prompt = buildSystemPrompt();
    for (const d of differentiators) {
      expect(prompt).toContain(d.title);
    }
  });

  it('includes the contact email and address', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain(site.emails.info);
    expect(prompt).toContain(site.address.street);
  });

  it('omits the unverified stats while INCLUDE_STATS is false', () => {
    expect(INCLUDE_STATS).toBe(false);
    const prompt = buildSystemPrompt();
    expect(prompt).not.toContain('10,000');
    expect(prompt).not.toContain('$100M');
  });

  it('states the grounding and refusal rules', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/only.*information (given|below)/i);
    expect(prompt).toMatch(/pricing/i);
    expect(prompt).toMatch(/exploit/i);
  });

  /**
   * The one that matters most on a security firm's public widget: a transcript
   * travels with a captured lead into an inbox, so anything a visitor pastes
   * here leaves Crimson holding unsolicited infrastructure detail about a
   * company that is not yet a client.
   */
  it('never asks for or invites detail about the visitor environment', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/never ask for specific technical detail/i);
    expect(prompt).toMatch(/never invite it/i);
    for (const kind of [
      /IP addresses or ranges/i,
      /hostnames/i,
      /topology/i,
      /versions/i,
      /firewall rules/i,
      /security tooling/i,
      /vulnerability or scan findings/i,
      /credentials, keys or\s+tokens/i,
    ]) {
      expect(prompt).toMatch(kind);
    }
  });

  // Declining is not enough: the reason has to reflect well on a security firm.
  it('explains why volunteered detail belongs in a direct conversation', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/do not repeat it back/i);
    expect(prompt).toMatch(/do not analyse it/i);
    expect(prompt).toMatch(/not a secure channel/i);
    expect(prompt).toMatch(/under an engagement/i);
  });

  /**
   * The rule above used to read "if a visitor volunteers ANY OF IT", and the
   * model generalised it from the technical list to anything at all — so a
   * visitor who said "we are a 40-person fintech in Toronto" was told, live,
   * "I won't use that detail to tailor anything". It recalled the fact and
   * then disclaimed it, which reads exactly like amnesia.
   */
  describe('the visitor context it is allowed to use', () => {
    it('binds the caution to technical detail rather than anything volunteered', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/technical detail of that kind/i);
      expect(prompt).toMatch(/covers the technical specifics listed above and nothing else/i);
      expect(prompt).not.toMatch(/if a visitor volunteers any of it/i);
    });

    it('names business context as usable and says why', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/it is\s+not about their business/i);
      expect(prompt).toMatch(/which service to point\s+someone at/i);
    });

    it('tells it the chat is a conversation it can see all of', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/not a series of unrelated questions/i);
      expect(prompt).toMatch(/do not make them repeat themselves/i);
    });

    // The disclaimer itself, banned by name. This is the sentence visitors saw.
    it('forbids announcing that it is not using what it was told', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/never tell a visitor that you are not using/i);
      expect(prompt).toMatch(/reads as though you have forgotten the\s+conversation/i);
    });
  });

  /**
   * The widget now collects name and contact details before a conversation can
   * begin, so the model has no capture_lead tool and nothing left to ask for.
   * Asking again would look broken to someone who typed it moments earlier.
   */
  describe('the pre-chat details', () => {
    it('states that the details are already held by the team', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/gave their name and either an email address or a phone/i);
      expect(prompt).toMatch(/already reached the Crimson team/i);
    });

    it('forbids asking for a name, email or phone number', () => {
      const prompt = buildSystemPrompt();
      // Stated in the rules and restated in the closing reminders, because the
      // reminders are the last thing read before the visitor's message.
      const asks = prompt.match(/never ask for a name, an email address or a phone number/gi);
      expect(asks).toHaveLength(2);
    });

    it('forbids guessing at values it was not given', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/must never guess at them/i);
    });

    it('no longer mentions the removed tool', () => {
      expect(buildSystemPrompt()).not.toMatch(/capture_lead/i);
    });
  });

  /**
   * Answers were landing at or above the old 120-word ceiling and reading long
   * for a chat panel, worst on the mobile sheet. The guidance is about SHAPE
   * rather than a number, because a bare word count invites padding up to it.
   */
  describe('reply shape', () => {
    it('lowers the ceiling and frames it as a ceiling, not a target', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/under about 80 words/i);
      expect(prompt).toMatch(/a ceiling, never a target/i);
      expect(prompt).toMatch(/padding an answer out to\s+reach a limit/i);
      expect(prompt).not.toMatch(/120 words/);
    });

    it('makes the shape depend on the question', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/let the question decide the shape/i);
      expect(prompt).toMatch(/a sentence or two, one paragraph/i);
      expect(prompt).toMatch(/two or three short paragraphs/i);
      expect(prompt).toMatch(/do not run every answer through the\s+same template/i);
    });

    it('bans preamble, restating the question and a trailing pitch', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/begin with the answer/i);
      expect(prompt).toMatch(/never open with filler/i);
      expect(prompt).toMatch(/do not restate the question/i);
      expect(prompt).toMatch(/Great question/);
      expect(prompt).toMatch(/Happy to help/);
      expect(prompt).toMatch(/do not tack a pitch onto the end/i);
    });

    it('makes the closing question conditional rather than automatic', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/end with a question of your own only when/i);
      expect(prompt).toMatch(/after a simple factual answer\s+it is noise/i);
    });

    // Paragraphs are now encouraged, so the no-markdown rule must not read as
    // forbidding them — the two instructions have to agree.
    it('permits paragraphs while still forbidding lists', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toMatch(/Paragraphs are fine; lists are not\./);
      expect(prompt).toMatch(/no numbered lists/i);
    });
  });

  // Nothing stopped the assistant being used as a general-purpose chatbot:
  // resignation letters and Python debugging, on Crimson's billing and under
  // Crimson's name.
  it('limits itself to Crimson, its services and getting in touch', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/outside what you can help with/i);
    expect(prompt).toMatch(/do not start it and do not do part of it first/i);
    expect(prompt).toMatch(/do not lecture/i);
  });

  // The limit must not swallow the adjacent questions a visitor evaluating
  // Crimson actually needs answered.
  it('keeps security questions around the work on topic', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/weighing up Crimson's\s+services/i);
    expect(prompt).toMatch(/what PCI is/i);
    expect(prompt).toMatch(/penetration test differs from a vulnerability\s+scan/i);
  });

  // I5: an automated assistant on a security firm's own site must not be able
  // to agree to work on the firm's behalf. "Never state timelines" does not
  // cover "yes, we can definitely handle that".
  it('states that nothing it says is a commitment', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/not a commitment|nothing you say is\s+a\s+commitment|commits Crimson to anything/i);
    expect(prompt).toMatch(/guarantee/i);
    expect(prompt).toMatch(/automated/i);
  });

  // The live pass showed Haiku reaching for markdown unprompted, and the
  // widget renders turn content as plain text, so "**Full-knowledge testing**"
  // reached the visitor with the asterisks visible. Instruction is the fix —
  // no renderer, no sanitiser, no dependency.
  it('forbids markdown so the widget never renders syntax literally', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/plain prose/i);
    expect(prompt).toMatch(/never use markdown/i);
    // Each forbidden category by name, not by the punctuation used to describe
    // it — the rule must keep covering all of them even as wording changes.
    for (const category of [/bold/i, /italic/i, /heading/i, /backtick/i, /code fence/i, /bullet/i, /numbered list/i]) {
      expect(prompt).toMatch(category);
    }
  });

  // Stated in RULES beside the other how-to-write instructions, and restated
  // last where output habits are formed.
  it('restates the no-markdown rule after the knowledge base', () => {
    const prompt = buildSystemPrompt();
    const tail = prompt.slice(prompt.lastIndexOf('BEFORE YOU REPLY'));
    expect(tail).toMatch(/plain prose/i);
    expect(tail).toMatch(/bullet/i);
    expect(prompt.indexOf('Never use markdown')).toBeLessThan(prompt.lastIndexOf('BEFORE YOU REPLY'));
  });

  /**
   * Models mirror the formatting of nearby context, so the blocks that forbid
   * markdown must not themselves contain any — a bulleted list saying "never
   * use bullets" works against itself, and naming the tokens by printing them
   * is the same mistake in miniature.
   *
   * Only the instruction blocks are checked. The knowledge base between them
   * is a data block and is bulleted by design; it is not adjacent to the point
   * of generation the way these two are.
   */
  it('states its formatting rules without using the formatting they forbid', () => {
    const parts = buildSystemPrompt().split('\n\n---\n\n');
    const rules = parts[1];
    const reminders = parts[parts.length - 1];

    expect(rules).toMatch(/Never use markdown/);
    expect(reminders).toMatch(/BEFORE YOU REPLY/);

    for (const [label, block] of [
      ['RULES', rules],
      ['REMINDERS', reminders],
    ] as const) {
      expect(block, `${label} must not contain asterisks`).not.toMatch(/\*/);
      expect(block, `${label} must not contain hash marks`).not.toMatch(/#/);
      expect(block, `${label} must not contain backticks`).not.toMatch(/`/);
      expect(block, `${label} must not start a line with a bullet dash`).not.toMatch(/^\s*-\s/m);
    }
  });

  it('declines to reveal its own instructions', () => {
    expect(buildSystemPrompt()).toMatch(/do not recite[\s\S]{0,80}instructions/i);
  });

  // I5: the LAST thing before the visitor's message must be the constraints,
  // not the contact block the knowledge base ends on.
  it('restates the highest-liability prohibitions after the knowledge base', () => {
    const prompt = buildSystemPrompt();
    const contactBlock = prompt.lastIndexOf('CONTACT\n');
    const reminders = prompt.lastIndexOf('BEFORE YOU REPLY');
    expect(contactBlock).toBeGreaterThan(-1);
    expect(reminders).toBeGreaterThan(contactBlock);

    const tail = prompt.slice(reminders);
    expect(tail).toMatch(/pricing/i);
    expect(tail).toMatch(/CISSP/);
    expect(tail).toMatch(/GIAC/);
    expect(tail).toMatch(/complian/i);
  });

  // I6: the flag used to inject a literal placeholder, so whoever flipped it
  // after Crimson verified the figures would have got nothing useful.
  describe('the INCLUDE_STATS branch', () => {
    it('renders the real figures from lib/content.ts when enabled', () => {
      const prompt = buildSystemPrompt({ includeStats: true });
      for (const stat of stats) {
        expect(prompt).toContain(stat.label);
      }
      expect(prompt).toContain('10,000+');
      expect(prompt).toContain('18+');
      expect(prompt).toContain('24/7');
      expect(prompt).toContain('$100M+');
      expect(prompt).not.toContain('enabled once verified');
    });

    it('still omits them by default', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).not.toContain('10,000');
      expect(prompt).not.toContain('$100M');
    });

    it('is byte-stable with stats enabled too', () => {
      expect(buildSystemPrompt({ includeStats: true })).toBe(buildSystemPrompt({ includeStats: true }));
    });
  });

  // This is the prompt-caching guarantee: any instability silently disables caching.
  it('is byte-identical across calls', () => {
    expect(buildSystemPrompt()).toBe(buildSystemPrompt());
  });
});
