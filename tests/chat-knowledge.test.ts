import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, INCLUDE_STATS } from '@/lib/chat-knowledge';
import { services, differentiators } from '@/lib/content';
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

  // This is the prompt-caching guarantee: any instability silently disables caching.
  it('is byte-identical across calls', () => {
    expect(buildSystemPrompt()).toBe(buildSystemPrompt());
  });
});
