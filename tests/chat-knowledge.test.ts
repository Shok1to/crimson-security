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
    for (const syntax of [/\*\*bold\*\*/, /## headings/, /backticks/, /bullet lists/, /numbered lists/]) {
      expect(prompt).toMatch(syntax);
    }
  });

  // Stated in RULES beside the other how-to-write instructions, and restated
  // last where output habits are formed.
  it('restates the no-markdown rule after the knowledge base', () => {
    const prompt = buildSystemPrompt();
    const tail = prompt.slice(prompt.lastIndexOf('BEFORE YOU REPLY'));
    expect(tail).toMatch(/no markdown/i);
    expect(prompt.indexOf('Never use markdown')).toBeLessThan(prompt.lastIndexOf('BEFORE YOU REPLY'));
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
