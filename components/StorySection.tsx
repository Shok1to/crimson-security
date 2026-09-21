import { story } from '@/lib/content';
import CircuitTexture from './CircuitTexture';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { ReportCard, ScopeCard, TeamCard } from './StoryCards';

const visuals = { scope: ScopeCard, team: TeamCard, report: ReportCard } as const;

export default function StorySection() {
  return (
    <section
      id="story"
      aria-labelledby="story-heading"
      className="theme-light relative overflow-hidden bg-ink-900 py-24 lg:py-32"
    >
      <CircuitTexture side="left" className="top-40 h-[620px] opacity-70" />
      <CircuitTexture side="right" className="bottom-24 hidden h-[620px] opacity-50 lg:block" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label="The Crimson approach"
          title={
            <span id="story-heading">
              Thorough by policy, <span className="text-crimson-gradient">practical by design.</span>
            </span>
          }
        />

        <div className="mt-8 lg:mt-12">
          {story.map((item, i) => {
            const Visual = visuals[item.visual];
            const flip = i % 2 === 1;
            return (
              <article
                key={item.n}
                className="grid items-center gap-12 border-t border-edge/10 py-16 first:border-t-0 first:pt-6 lg:grid-cols-2 lg:gap-20 lg:py-24 lg:first:pt-10"
              >
                <div className={flip ? 'lg:order-2' : ''}>
                  <Reveal className="flex items-baseline gap-3 font-display">
                    <span className="text-crimson-gradient text-7xl font-bold leading-none tabular-nums sm:text-8xl">
                      {item.n}
                    </span>
                    <span className="text-2xl font-medium text-silver-500">
                      / {String(story.length).padStart(2, '0')}
                    </span>
                  </Reveal>

                  <Reveal delay={0.08}>
                    <p className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.28em] text-silver-400">
                      {item.eyebrow}
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-bold leading-snug text-silver-50 sm:text-3xl lg:text-4xl">
                      {item.title}
                    </h3>
                  </Reveal>

                  <Reveal delay={0.16}>
                    <ul className="leaf-list mt-7 space-y-3 text-base text-silver-200 sm:text-lg">
                      {item.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </Reveal>
                </div>

                <Reveal delay={0.2} className={flip ? 'lg:order-1' : ''}>
                  <Visual />
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
