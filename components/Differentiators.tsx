import { differentiators } from '@/lib/content';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

/**
 * Open layout (no cards): thin-line icon, title, one short sentence, and a crimson-to-clear
 * rule — on a pale tinted field with a soft crimson glow. Type matches the rest of the site.
 */
export default function Differentiators() {
  return (
    <section
      id="why-crimson"
      aria-labelledby="why-heading"
      className="theme-light relative overflow-hidden py-24 lg:py-32"
      style={{ background: '#f7f3f3' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 560px at 92% 6%, rgba(227,34,15,0.11), transparent 70%), radial-gradient(circle 460px at 0% 97%, rgba(161,0,5,0.07), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label="Why Crimson"
          title={
            <span id="why-heading">
              Nine commitments behind <span className="text-crimson-gradient">every engagement.</span>
            </span>
          }
        />

        <ul className="mt-16 grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-20">
          {differentiators.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal as="li" key={item.title} delay={(i % 3) * 0.08} className="h-full">
                <div className="flex h-full flex-col">
                  <Icon className="h-9 w-9 text-crimson-500" strokeWidth={1.15} aria-hidden="true" />
                  <h3 className="mt-8 font-display text-xl font-bold leading-snug text-silver-50">
                    {item.title}
                  </h3>
                  <p className="mb-8 mt-2 max-w-sm text-sm leading-relaxed text-silver-400">{item.description}</p>
                  <span
                    aria-hidden="true"
                    className="mt-auto block h-px bg-gradient-to-r from-crimson-500 via-crimson-400/40 to-transparent"
                  />
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
