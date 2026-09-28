import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { QUICK_REPLIES } from '@/lib/quick-replies';
import { buildSystemPrompt } from '@/lib/chat-knowledge';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/chat-config';
import { validateConversation } from '@/lib/chat-validation';

describe('QUICK_REPLIES', () => {
  /**
   * Pinned at four, not a range. Six chips at the 44px accessibility floor ran
   * to 320px — three quarters of the visible scroll area — and clipped the
   * last one on first open. The design range is still 4-6, but landing at the
   * top of it needs the panel re-measured, so a fifth entry should fail here
   * and make that a decision rather than an accident.
   */
  it('offers exactly four suggestions, so they fit the panel on first open', () => {
    expect(QUICK_REPLIES).toHaveLength(4);
  });

  it('has no duplicates', () => {
    expect(new Set(QUICK_REPLIES).size).toBe(QUICK_REPLIES.length);
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
    // The grounding titles the four remaining suggestions declare. The module
    // throws at load if one of these leaves lib/content.ts; this is the other
    // half — that it also reaches the prompt the assistant answers from.
    for (const term of [
      'Penetration Testing',
      'SSAE 16 / SOC Audits',
      'Remote Pre-Audit Preparation',
      'No Limit Policy',
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

    it('imports QUICK_REPLIES once', () => {
      const imports = widget.match(/import \{[^}]*QUICK_REPLIES[^}]*\} from '@\/lib\/quick-replies';/g);
      expect(imports).toHaveLength(1);
    });

    it('maps it at both render sites rather than duplicating the list', () => {
      expect(widget.match(/QUICK_REPLIES\.map\(/g)).toHaveLength(2);
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
