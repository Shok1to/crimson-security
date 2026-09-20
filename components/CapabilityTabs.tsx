'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, type KeyboardEvent } from 'react';
import { capabilityTabs, services, type CapabilityTab } from '@/lib/content';
import { AssessVisual, MonitorVisual, RespondVisual, TestVisual } from './CapabilityVisuals';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const visuals: Record<CapabilityTab['id'], () => JSX.Element> = {
  assess: AssessVisual,
  test: TestVisual,
  monitor: MonitorVisual,
  respond: RespondVisual,
};

export default function CapabilityTabs() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = capabilityTabs[active];
  const Visual = visuals[current.id];

  const select = (index: number) => {
    const next = (index + capabilityTabs.length) % capabilityTabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        select(active + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        select(active - 1);
        break;
      case 'Home':
        e.preventDefault();
        select(0);
        break;
      case 'End':
        e.preventDefault();
        select(capabilityTabs.length - 1);
        break;
    }
  };

  return (
    <section id="capabilities" aria-labelledby="capabilities-heading" className="relative overflow-hidden bg-ink-800 py-24 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 85% 0%, rgba(161,0,5,0.32), transparent 70%), radial-gradient(50% 45% at 0% 100%, rgba(117,0,1,0.28), transparent 70%)',
        }}
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label="Capabilities"
          title={
            <span id="capabilities-heading">
              From first assessment to <span className="text-crimson-gradient">incident response.</span>
            </span>
          }
          description="Pick a discipline to see how we approach it."
        />

        <Reveal delay={0.1} className="mt-12">
          <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
            {/* Tab list — horizontal scroller on mobile, vertical rail on desktop */}
            <div
              role="tablist"
              aria-label="Service categories"
              onKeyDown={onKeyDown}
              className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden"
            >
              {capabilityTabs.map((tab, i) => {
                const selected = i === active;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={`group relative flex shrink-0 snap-start items-center gap-3 rounded-xl border px-5 py-4 text-left font-display transition-colors duration-300 lg:w-full ${
                      selected
                        ? 'border-crimson-400/60 bg-crimson-600/10 text-white'
                        : 'border-edge/10 text-silver-400 hover:border-silver-400/40 hover:text-silver-100'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold tabular-nums tracking-[0.2em] ${
                        selected ? 'text-crimson-300' : 'text-silver-500'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="whitespace-nowrap text-base font-semibold lg:whitespace-normal">
                      {tab.label}
                    </span>
                    {selected && (
                      <motion.span
                        layoutId="tab-indicator"
                        aria-hidden="true"
                        className="absolute inset-y-3 left-0 hidden w-[3px] rounded-full bg-crimson-400 lg:block"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Panel */}
            <div className="silver-border card-surface relative min-h-[34rem] overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  role="tabpanel"
                  id={`panel-${current.id}`}
                  aria-labelledby={`tab-${current.id}`}
                  tabIndex={0}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="grid items-center gap-10 p-6 sm:p-10 xl:grid-cols-2"
                >
                  <div>
                    <h3 className="font-display text-2xl font-bold leading-snug text-silver-50 sm:text-3xl">
                      {current.headline}
                    </h3>
                    <p className="mt-4 leading-relaxed text-silver-300">{current.description}</p>

                    <ul className="leaf-list mt-6 space-y-2 text-silver-200">
                      {current.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>

                    <div className="mt-8 space-y-3">
                      {current.services.map((id) => {
                        const svc = services.find((s) => s.id === id)!;
                        const Icon = svc.icon;
                        return (
                          <div
                            key={id}
                            className="flex items-start gap-4 rounded-xl border border-edge/10 bg-edge/[0.02] p-4"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-silver-400/30 bg-ink-800 text-silver-200">
                              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block font-display text-sm font-semibold text-silver-50">
                                {svc.title}
                              </span>
                              <span className="mt-0.5 block text-sm text-silver-400">
                                {svc.points.join(' · ')}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-0 rounded-full opacity-60"
                      style={{
                        background:
                          'radial-gradient(closest-side, rgba(161,0,5,0.28), transparent 75%)',
                      }}
                    />
                    <div className="relative">
                      <Visual />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
