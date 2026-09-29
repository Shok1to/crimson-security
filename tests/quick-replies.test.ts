import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OPENING_QUICK_REPLIES, QUICK_REPLIES } from '@/lib/quick-replies';
import { buildSystemPrompt } from '@/lib/chat-knowledge';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import { validateConversation } from '@/lib/chat-validation';

describe('QUICK_REPLIES', () => {
  /**
   * Exact numbers, not ranges, so a ninth question or a fifth greeting chip is
   * a decision rather than an accident.
   *
   * Four in the greeting because six chips measured 320px against a 424px
   * scroll area with the last one clipped; four measure 217px. Eight in the
   * menu because that is its own surface, where scrolling is expected.
   */
  it('offers exactly eight suggestions in the menu', () => {
    expect(QUICK_REPLIES).toHaveLength(8);
  });

  it('offers exactly four in the greeting, where space is tight', () => {
    expect(OPENING_QUICK_REPLIES).toHaveLength(4);
  });

  // One source, two surfaces: a visitor must not meet a question in the menu
  // that contradicts one in the greeting.
  it('makes the greeting set a subset of the menu, in the same order', () => {
    for (const question of OPENING_QUICK_REPLIES) {
      expect(QUICK_REPLIES).toContain(question);
    }
    const positions = OPENING_QUICK_REPLIES.map((q) => QUICK_REPLIES.indexOf(q));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('has no duplicates', () => {
    expect(new Set(QUICK_REPLIES).size).toBe(QUICK_REPLIES.length);
  });

  // Crimson's own labels are not what a visitor arrives knowing.
  it('asks in a prospect voice rather than naming the site taxonomy', () => {
    for (const question of QUICK_REPLIES) {
      expect(question).not.toMatch(/No Limit Policy|No Hacker Policy|SSAE 16/);
    }
  });

  it('is short enough to sit on a button and reads as a question', () => {
    for (const question of QUICK_REPLIES) {
      expect(question.trim()).toBe(question);
      expect(question.length).toBeGreaterThan(0);
      expect(question.length).toBeLessThanOrEqual(60);
      expect(question.endsWith('?')).toBe(true);
    }
  });

  /**
   * Tapping one posts it down the same path as typing it, so each must be a
   * payload the server's own validator accepts.
   */
  it('produces a valid first turn when tapped', () => {
    for (const question of QUICK_REPLIES) {
      expect(question.length).toBeLessThanOrEqual(MAX_USER_MESSAGE_CHARS);
      const result = validateConversation({ messages: [{ role: 'user', content: question }] });
      expect(result.ok, question).toBe(true);
    }
  });

  /**
   * The point of deriving them from lib/content.ts: a suggestion must not
   * invite a question the assistant has no grounding for. The module throws at
   * load time if a grounding title disappears; this checks the other half —
   * that the distinctive terms the questions use are actually in the prompt.
   */
  it('only asks about things the system prompt is grounded in', () => {
    const prompt = buildSystemPrompt();
    // Every grounding title the eight declare. The module throws at load if one
    // of these leaves lib/content.ts; this is the other half — that it also
    // reaches the prompt the assistant answers from.
    for (const term of [
      'Penetration Testing',
      'SSAE 16 / SOC Audits',
      'Remote Pre-Audit Preparation',
      'Compliance Assessments & Reports',
      'No Limit Policy',
      'No Hacker Policy',
      'Owner Accessibility',
      'Remediation Assistance',
      'Detailed Reporting',
      'Vendor Security Management',
      'Incident Response Services',
      'Forensic Analysis Services',
    ]) {
      expect(prompt).toContain(term);
    }
  });

  /**
   * The opening chips and the input-row menu render the same four questions.
   * Without a DOM the render itself is untestable, but the thing that would
   * actually rot is a second hardcoded copy of the list in the component, so
   * that is what this pins.
   */
  describe('the widget renders them from this module only', () => {
    const widget = readFileSync(
      fileURLToPath(new URL('../components/ChatWidget.tsx', import.meta.url)),
      'utf8',
    );

    it('imports them from this module once', () => {
      const imports = widget.match(/import \{[^}]*QUICK_REPLIES[^}]*\} from '@\/lib\/quick-replies';/g);
      expect(imports).toHaveLength(1);
    });

    it('renders the greeting from the subset and the menu from the full set', () => {
      expect(widget.match(/OPENING_QUICK_REPLIES\.map\(/g)).toHaveLength(1);
      // Once for the menu; the greeting match above is the only other .map, and
      // the OPENING_ prefix means it is not counted twice here.
      expect(widget.match(/(?<!OPENING_)QUICK_REPLIES\.map\(/g)).toHaveLength(1);
    });

    it('hardcodes none of the questions', () => {
      for (const question of QUICK_REPLIES) {
        expect(widget, question).not.toContain(question);
      }
    });

    it('styles both sets from one shared class', () => {
      expect(widget.match(/className=\{CHIP_CLASS\}/g)).toHaveLength(2);
    });
  });

  it('never suggests something the grounding rules forbid answering', () => {
    for (const question of QUICK_REPLIES) {
      expect(question).not.toMatch(/price|pricing|cost|quote|how much|how long|timeline|SLA/i);
    }
  });
});
