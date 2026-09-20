'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Static text after the counted number, e.g. "/7" in "24/7". */
  tail?: string;
  duration?: number;
  className?: string;
}

const format = new Intl.NumberFormat('en-CA');

/**
 * Counts from 0 to `value` every time it scrolls into view (and resets when it leaves,
 * so it plays again on the way back).
 * - The final value is what's rendered on the server (SEO / no-JS / reduced-motion).
 * - With `prefers-reduced-motion`, it stays on the final value and never counts.
 * - Screen readers get the final value only, never the in-flight numbers.
 */
export default function CountUp({
  value,
  prefix = '',
  suffix = '',
  tail = '',
  duration = 2,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce !== false) return;
    // Off-screen: park at 0 so the next entry counts up from the start.
    if (!inView) {
      setDisplay(0);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value, duration]);

  const final = `${prefix}${format.format(value)}${suffix}${tail}`;

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">
        {prefix}
        {format.format(display)}
        {suffix}
        {tail}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
