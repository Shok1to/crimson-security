import Link from 'next/link';
import { ArrowRight, ScanSearch, Siren } from 'lucide-react';
import Reveal from '@/components/Reveal';
import ResourcesHeader from '@/components/ResourcesHeader';
import { resourceMetadata } from '@/lib/resources';

const TITLE = 'Services';
const DESCRIPTION =
  'Explore Crimson Security service guides: vulnerability assessment and penetration testing (VAPT), and incident response.';

export const metadata = resourceMetadata(TITLE, DESCRIPTION, '/resources/services');

const cards = [
  {
    icon: ScanSearch,
    href: '/vapt',
    label: 'VAPT',
    title: 'Vulnerability Assessment & Penetration Testing',
    body: 'Quarterly vulnerability assessments and annual internal and external penetration testing to harden your infrastructure before adversaries strike.',
  },
  {
    icon: Siren,
    href: '/incident-response',
    label: 'Incident Response',
    title: 'Incident Management & Tactical Response',
    body: 'Rapid triage, containment and recovery support, plus forensic analysis, to minimize downtime and protect critical assets.',
  },
];

export default function ServicesPage() {
  return (
    <div className="theme-light bg-ink-900">
      <ResourcesHeader title={TITLE} intro={DESCRIPTION} section />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <ul className="grid gap-6 md:grid-cols-2">
          {cards.map((card, i) => (
            <Reveal as="li" key={card.href} delay={i * 0.08}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-edge/10 bg-ink-800 p-7 shadow-card-sm transition-colors hover:border-crimson-500/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson-600/15 text-crimson-500">
                    <card.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-sm font-semibold text-silver-100">{card.label}</span>
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold leading-snug text-silver-50 text-balance">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-silver-300">{card.body}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 font-display text-sm font-semibold text-silver-300 transition-colors group-hover:text-silver-50">
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </div>
  );
}
