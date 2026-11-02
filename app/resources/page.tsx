import { BookOpen, BriefcaseBusiness, PlayCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/Reveal';
import ResourcesHeader from '@/components/ResourcesHeader';
import { resourceMetadata } from '@/lib/resources';

const TITLE = 'Resources';
const DESCRIPTION =
  'Crimson Security blog articles, service guides, videos and case studies on compliance, penetration testing and incident response.';

export const metadata = resourceMetadata(TITLE, DESCRIPTION, '/resources');

const sections = [
  {
    icon: BookOpen,
    href: '/resources/blog',
    label: 'Blog',
    body: 'Insights on compliance, penetration testing and incident response for Canadian organizations.',
  },
  {
    icon: ShieldCheck,
    href: '/resources/services',
    label: 'Services',
    body: 'Guides to our VAPT and incident response services and how they work.',
  },
  {
    icon: PlayCircle,
    href: '/resources/videos',
    label: 'Videos',
    body: 'Watch Crimson Security Canada explain who we are and how we help.',
  },
  {
    icon: BriefcaseBusiness,
    href: '/resources/case-studies',
    label: 'Case Studies',
    body: 'Real results from the organizations we have worked with.',
  },
];

export default function ResourcesPage() {
  return (
    <div className="theme-light bg-ink-900">
      <ResourcesHeader
        title={TITLE}
        intro="Learn how Crimson Security helps Canadian organizations find the gaps and respond when it counts."
      />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sections.map((s, i) => (
            <Reveal as="li" key={s.href} delay={i * 0.08}>
              <Link
                href={s.href}
                className="group flex h-full flex-col rounded-2xl border border-edge/10 bg-ink-800 p-7 shadow-card-sm transition-colors hover:border-crimson-500/50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson-600/15 text-crimson-500">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-6 font-display text-xl font-semibold text-silver-50">{s.label}</h2>
                <p className="mt-3 text-sm leading-relaxed text-silver-300">{s.body}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 font-display text-sm font-semibold text-silver-300 transition-colors group-hover:text-silver-50">
                  Explore
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
