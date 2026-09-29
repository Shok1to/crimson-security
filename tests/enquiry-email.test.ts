import { describe, it, expect } from 'vitest';
import { buildSubject, escapeHtml, formatTimestamp, renderHtml, renderText } from '@/lib/enquiry-email';
import type { Enquiry } from '@/lib/enquiry-delivery';
import type { LeadAnalysis } from '@/lib/lead-analysis';
import { LOGO_BASE64, LOGO_CONTENT_ID } from '@/lib/enquiry-logo';

const at = new Date('2026-09-30T14:32:00.000Z');

const base: Enquiry = {
  source: 'contact-form',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'We need a PCI assessment.',
};

const analysis: LeadAnalysis = {
  summary: 'Ada wants a PCI assessment.',
  interest: 'Compliance Assessments & Reports',
  urgency: 'medium',
  signals: ['asked about PCI'],
  unknowns: ['which environment is in scope'],
  suggestedNextStep: 'Call Ada.',
  reply: 'Hi Ada,\n\nHappy to help.\n\n— The Crimson Security team',
};

describe('escapeHtml', () => {
  it('escapes the five characters that matter', () => {
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
  });

  /** If & were escaped last it would rewrite the entities produced before it. */
  it('escapes the ampersand first so entities are not double-escaped', () => {
    expect(escapeHtml('<a>')).toBe('&lt;a&gt;');
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('renderHtml', () => {
  /**
   * Every value in this email came from a stranger on the internet. The team
   * reads it in a mail client, and some of those render HTML.
   */
  describe('visitor-supplied content is escaped', () => {
    /**
     * Asserted against the EXACT payload rather than a fragment like "<img":
     * the template has legitimate markup of its own (the brand logo is an
     * <img>), so a fragment match cannot tell an injection from the design.
     */
    it.each([
      ['name', 'name', '<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
      ['message', 'message', '<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
      ['company', 'company', '<b>Acme</b>', '&lt;b&gt;Acme&lt;/b&gt;'],
      ['email', 'email', 'a@b.co"><script>x</script>', '&quot;&gt;&lt;script&gt;'],
    ])('escapes a script payload in the %s', (_label, field, payload, escaped) => {
      const html = renderHtml({ ...base, [field]: payload }, null, at);
      expect(html).not.toContain(payload);
      expect(html).toContain(escaped);
    });

    it('escapes the transcript, which is the longest visitor-controlled field', () => {
      const html = renderHtml(
        { ...base, transcript: [{ role: 'user', content: '<script>bad()</script>' }] },
        null,
        at,
      );
      expect(html).not.toMatch(/<script>bad/i);
      expect(html).toContain('&lt;script&gt;');
    });

    /**
     * The model's output is untrusted too — a visitor can steer what it writes.
     */
    it('escapes the analysis and the suggested reply', () => {
      const html = renderHtml(base, { ...analysis, reply: '<script>x</script>' }, at);
      expect(html).not.toMatch(/<script>x/i);
    });
  });

  it('turns newlines into breaks without unescaping anything', () => {
    const html = renderHtml({ ...base, message: 'one\n<b>two</b>' }, null, at);
    expect(html).toContain('one<br>&lt;b&gt;two&lt;/b&gt;');
  });

  describe('the contact block', () => {
    it('links a supplied email and phone', () => {
      const html = renderHtml({ ...base, phone: '+1 (416) 555-0134' }, null, at);
      expect(html).toContain('mailto:ada@example.com');
      // Stripped to digits and a leading plus so the dial link actually works.
      expect(html).toContain('tel:+14165550134');
    });

    /**
     * A missing row reads as an oversight. Saying so tells the team at a glance
     * that replying means picking up the phone.
     */
    it('says an absent email is absent rather than omitting the row', () => {
      const html = renderHtml({ ...base, email: '', phone: '416-555-0134' }, null, at);
      expect(html).toContain('not given');
      expect(html).not.toContain('mailto:');
    });

    it('promises a working reply-to only when there is an address', () => {
      expect(renderHtml(base, null, at)).toContain('reaches the sender directly');
      expect(renderHtml({ ...base, email: '' }, null, at)).not.toContain(
        'reaches the sender directly',
      );
    });
  });

  describe('optional blocks', () => {
    it('omits the briefing entirely when analysis is null', () => {
      const html = renderHtml(base, null, at);
      expect(html).not.toContain('Briefing');
      expect(html).not.toContain('Suggested reply');
    });

    it('includes the briefing and labels it as machine-written', () => {
      const html = renderHtml(base, analysis, at);
      expect(html).toContain('Briefing');
      expect(html).toContain('Written by Claude');
      expect(html).toMatch(/advisory and unverified/i);
    });

    // It is a draft. The email must not let anyone think it already went out.
    it('says the suggested reply has not been sent', () => {
      expect(renderHtml(base, analysis, at)).toContain('it has not been sent to anyone');
    });

    it('omits the transcript when there is none', () => {
      expect(renderHtml(base, null, at)).not.toContain('Full conversation');
    });
  });

  describe('the brand header', () => {
    /**
     * Many clients block remote images by default. The wordmark is live text
     * beside the mark, so a blocked image costs the logo and never the
     * identity — and the mark carries an empty alt so it does not produce a
     * second copy of the name.
     */
    it('carries the wordmark as text, not only as an image', () => {
      const html = renderHtml(base, null, at);
      expect(html).toContain('>Crimson Security</span>');
    });

    it('marks the logo decorative so a blocked image adds no stray alt text', () => {
      expect(renderHtml(base, null, at)).toContain('alt=""');
    });

    /**
     * Embedded, not hotlinked. A remote <img> fails in a client that blocks
     * remote images, in a send from an environment whose site.url is not
     * publicly reachable, and at any moment before the asset is deployed.
     */
    it('references the logo by content id rather than a URL', () => {
      const html = renderHtml(base, null, at);
      expect(html).toContain(`src="cid:${LOGO_CONTENT_ID}"`);
    });

    it('does not hotlink the logo from the site', () => {
      const html = renderHtml(base, null, at);
      expect(html).not.toContain('crimson-security-mark-email.png');
      expect(html).not.toMatch(/<img[^>]+src="https?:/);
    });

    // Without this a client that auto-inverts will recolour the design.
    it('declares a light colour scheme', () => {
      expect(renderHtml(base, null, at)).toContain('name="color-scheme" content="light"');
    });
  });

  /**
   * One obvious action. Acting on a lead should be a click, not a copy, a
   * paste and a tidy-up.
   */
  describe('the primary action', () => {
    it('prefills a reply with the draft when there is an email address', () => {
      const html = renderHtml(base, analysis, at);
      expect(html).toContain('Reply to Ada');
      expect(html).toContain('mailto:ada@example.com?subject=');
      // The draft, URL-encoded into the body.
      expect(html).toContain(encodeURIComponent('Happy to help.'));
    });

    it('offers a call instead when only a phone number was given', () => {
      const html = renderHtml({ ...base, email: '', phone: '+1 (416) 555-0134' }, analysis, at);
      expect(html).toContain('Call Ada');
      expect(html).toContain('href="tel:+14165550134');
      expect(html).not.toContain('mailto:');
    });

    it('uses the first name only, so the button label stays short', () => {
      const html = renderHtml({ ...base, name: 'Ada Byron King Lovelace' }, analysis, at);
      expect(html).toContain('Reply to Ada<');
    });

    it('still prefills the subject when there is no draft to carry', () => {
      const html = renderHtml(base, null, at);
      expect(html).toContain('mailto:ada@example.com?subject=');
      expect(html).not.toContain('&body=');
    });

    /**
     * Some clients truncate a mailto past roughly 2,000 characters, and half a
     * draft pasted into a reply is worse than none. The draft stays in the
     * email to copy from.
     */
    it('drops the prefilled body when the draft is too long for a mailto', () => {
      const html = renderHtml(base, { ...analysis, reply: 'x'.repeat(2000) }, at);
      expect(html).toContain('mailto:ada@example.com?subject=');
      expect(html).not.toContain('&body=');
      // Still shown in full in the email itself.
      expect(html).toContain('x'.repeat(2000));
    });

    it('escapes the ampersand in the mailto so the attribute stays valid', () => {
      const html = renderHtml(base, analysis, at);
      expect(html).toContain('&amp;body=');
      expect(html).not.toMatch(/href="mailto:[^"]*[^p]&body=/);
    });
  });

  it('records the consent wording when present', () => {
    const html = renderHtml({ ...base, consent: 'I agree. (agreed 2026-09-30)' }, null, at);
    expect(html).toContain('I agree. (agreed 2026-09-30)');
  });
});

describe('renderText', () => {
  it('carries the same essentials as the HTML part', () => {
    const text = renderText({ ...base, transcript: [{ role: 'user', content: 'hello' }] }, analysis, at);
    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('ada@example.com');
    expect(text).toContain('We need a PCI assessment.');
    expect(text).toContain('Ada wants a PCI assessment.');
    expect(text).toContain('— The Crimson Security team');
    expect(text).toContain('Visitor: hello');
  });

  it('carries no markup, since it is the plain-text part', () => {
    const text = renderText(base, analysis, at);
    expect(text).not.toMatch(/<[a-z]/i);
  });

  it('labels the briefing as unverified here too', () => {
    expect(renderText(base, analysis, at)).toMatch(/advisory, not verified/i);
  });
});

describe('buildSubject', () => {
  it('names the sender', () => {
    expect(buildSubject(base, null)).toBe('Website enquiry from Ada Lovelace');
  });

  it('adds the company when there is one', () => {
    expect(buildSubject({ ...base, company: 'Analytical Engines' }, null)).toContain(
      '(Analytical Engines)',
    );
  });

  it('adds the interest the briefing identified, so a full inbox is scannable', () => {
    expect(buildSubject(base, analysis)).toContain('Compliance Assessments & Reports');
  });

  it('leaves "general" out rather than adding a word that says nothing', () => {
    expect(buildSubject(base, { ...analysis, interest: 'general' })).toBe(
      'Website enquiry from Ada Lovelace',
    );
  });

  /** Defence in depth: the delivery boundary strips this too. */
  it('never carries CR/LF', () => {
    const subject = buildSubject({ ...base, name: 'Ada\r\nBcc: someone@evil.test' }, null);
    expect(subject).not.toMatch(/[\r\n]/);
  });
});

describe('formatTimestamp', () => {
  /**
   * Toronto, because that is where the team reads it. A UTC stamp makes
   * everyone do arithmetic before they know whether an enquiry is fresh.
   */
  it('renders in Toronto time, not UTC', () => {
    // 14:32 UTC is 10:32 EDT.
    expect(formatTimestamp(at)).toMatch(/10:32/);
  });
});
