import { describe, it, expect } from 'vitest';
import { differentiators, supportHours } from '@/lib/content';

/**
 * The JSON-LD in app/layout.tsx and the visible differentiator copy both read
 * these values, so the structured data cannot drift from what the page says.
 * This pins the two halves to each other.
 */
describe('supportHours', () => {
  it('still produces the differentiator copy it replaced, byte for byte', () => {
    const support = differentiators.find((d) => d.title === 'Ongoing Technical Support');
    expect(support).toBeDefined();
    // The U+2060 word joiners around the en dash are deliberate: they stop
    // "9am-5pm" breaking across lines at the dash.
    expect(support?.description).toBe('Technical support Monday to Friday, 9am⁠–⁠5pm.');
  });

  it('keeps the machine-readable times consistent with the displayed ones', () => {
    expect(supportHours.opens).toBe('09:00');
    expect(supportHours.closes).toBe('17:00');
    expect(supportHours.display).toContain('9am');
    expect(supportHours.display).toContain('5pm');
  });

  it('keeps the day range consistent with the displayed one', () => {
    expect(supportHours.days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    expect(supportHours.display).toMatch(/^Monday to Friday,/);
  });

  // openingHoursSpecification wants ISO 8601 local times, not "9am".
  it('uses 24-hour ISO times, which is what the schema expects', () => {
    for (const time of [supportHours.opens, supportHours.closes]) {
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
