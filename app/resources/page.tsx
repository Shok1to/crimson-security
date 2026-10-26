import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ScanSearch, Siren } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { formatPostDate, getPosts } from '@/lib/posts';
import { site, socialImageAlt } from '@/lib/site';

const TITLE = 'Resources';
const DESCRIPTION =
  'Explore Crimson Security service guides: vulnerability assessment and penetration testing (VAPT), and incident response.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/resources' },
  // Restated in full: Next merges openGraph/twitter per key (see app/privacy/page.tsx).
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    siteName: site.name,
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    url: '/resources',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: socialImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: socialImageAlt }],
  },
};

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

export default function ResourcesPage() {
  const items = cards;
  const posts = getPosts();

  return (
    <div className="theme-light bg-ink-900">
      <header className="mx-auto max-w-7xl px-5 pb-10 pt-36 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-base text-silver-400">
          <Link href="/" className="transition-colors hover:text-silver-50">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2.5">
            ›
          </span>
          <span aria-current="page" className="font-medium text-silver-100">Resources</span>
        </nav>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-silver-50 sm:text-5xl lg:text-6xl">
          Resources
        </h1>
        <p className="mt-4 max-w-2xl text-base text-silver-300 sm:text-lg">
          Learn how Crimson Security helps Canadian organizations find the gaps and respond when it counts.
        </p>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <ul className="grid gap-6 md:grid-cols-2">
          {items.map((card, i) => (
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

        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {posts.map((post, i) => (
            <Reveal as="li" key={post.slug} delay={i * 0.08}>
              <Link
                href={`/resources/${post.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-edge/10 bg-ink-800 p-7 shadow-card-sm transition-colors hover:border-crimson-500/50"
              >
                <div className="flex items-center justify-between gap-4 text-sm text-silver-400">
                  <span className="flex items-center gap-3">
                    <Image
                      src={post.authorImage}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-silver-200">{post.author}</span>
                  </span>
                  <span>
                    {formatPostDate(post.updated)} <span aria-hidden="true">/</span> {post.readMinutes} min read
                  </span>
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold leading-snug text-silver-50 text-balance">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-silver-300">{post.description}</p>
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
