'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealTag = 'div' | 'li' | 'section' | 'article' | 'p' | 'h2' | 'h3' | 'span';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds. Use small multiples (0.08) to stagger siblings. */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
  as?: RevealTag;
}

/**
 * Fade + slide-up on viewport entry (IntersectionObserver under the hood, fires once).
 * Reduced-motion is handled globally by <Providers> — transforms are dropped, fade remains.
 */
export default function Reveal({ children, className, delay = 0, y = 28, as = 'div' }: RevealProps) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}
