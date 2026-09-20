import { services } from '@/lib/content';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { serviceArt } from './ServiceIllustrations';

/** Subtle pixel grid + crimson wash behind each illustration. */
const panelStyle = {
  background:
    'radial-gradient(85% 120% at 85% 0%, rgba(227,34,15,0.34), transparent 62%), radial-gradient(60% 90% at 0% 100%, rgba(117,0,1,0.4), transparent 70%), linear-gradient(160deg, #1d0b0d 0%, #2c080b 100%)',
} as const;

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '26px 26px',
  maskImage: 'radial-gradient(ellipse at 50% 50%, #000 20%, transparent 78%)',
  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 20%, transparent 78%)',
} as const;

/** Wide art is cropped toward the centre; fade the sides so overflow reads as intentional. */
const fadeEdges = {
  maskImage: 'linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)',
} as const;

export default function ServicesGrid() {
  return (
    <section id="services" aria-labelledby="services-heading" className="theme-light relative bg-ink-950 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label="What we do"
          title={
            <span id="services-heading">
              Assess, test, monitor <span className="text-crimson-gradient">and respond.</span>
            </span>
          }
          description="Eight services covering compliance, testing, monitoring and incident response — delivered by certified technicians."
        />

        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {services.map((service, i) => {
            const Art = serviceArt[service.id];
            const wide = !!service.wide;
            return (
              <Reveal
                as="li"
                key={service.id}
                delay={(i % 4) * 0.08}
                className={`h-full ${wide ? 'md:col-span-2' : ''}`}
              >
                <article className="hover-lift silver-border card-surface group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-card-sm hover:shadow-crimson-glow">
                  {/* illustration panel */}
                  <div
                    className={`relative overflow-hidden ${wide ? 'min-h-48 flex-1' : 'h-48 shrink-0'}`}
                    style={panelStyle}
                  >
                    <div aria-hidden="true" className="absolute inset-0 opacity-70" style={gridStyle} />
                    <div
                      className="svc-art absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      style={wide ? fadeEdges : undefined}
                    >
                      <Art wide={wide} />
                    </div>
                  </div>

                  {/* copy */}
                  <div className={`flex flex-col p-6 ${wide ? 'shrink-0' : 'flex-1'}`}>
                    <p className="flex items-center gap-3 font-display text-[0.7rem] font-semibold uppercase tracking-[0.22em]">
                      <span className="text-crimson-300">{service.category}</span>
                      <span aria-hidden="true" className="h-px w-6 bg-edge/20" />
                      <span aria-hidden="true" className="tabular-nums text-silver-500">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </p>
                    <h3 className="mt-3 font-display text-xl font-bold leading-snug text-silver-50">{service.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-silver-400">{service.summary}</p>
                    <div className={wide ? 'pt-5' : 'mt-auto pt-5'}>
                      <ul
                        className={`leaf-list grid gap-x-8 gap-y-2 border-t border-edge/10 pt-5 text-sm text-silver-200 ${
                          wide ? 'sm:grid-cols-2' : ''
                        }`}
                      >
                        {service.points.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
