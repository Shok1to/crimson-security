import Link from 'next/link';
import ResourcesHeader from '@/components/ResourcesHeader';
import { resourceMetadata } from '@/lib/resources';

const TITLE = 'Case Studies';
const DESCRIPTION = 'Real results from the organizations Crimson Security has worked with.';

export const metadata = resourceMetadata(TITLE, DESCRIPTION, '/resources/case-studies');

export default function CaseStudiesPage() {
  return (
    <div className="theme-light bg-ink-900">
      <ResourcesHeader title={TITLE} intro={DESCRIPTION} section />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="rounded-2xl border border-edge/10 bg-ink-800 p-10 text-center shadow-card-sm">
          <h2 className="font-display text-xl font-semibold text-silver-50">Coming soon</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-silver-300">
            We are putting our first case studies together. In the meantime, read our latest articles or get in touch
            to discuss your security roadmap.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 font-display text-sm font-semibold">
            <Link href="/resources/blog" className="text-silver-300 transition-colors hover:text-silver-50">
              Read the blog
            </Link>
            <Link href="/#contact" className="text-crimson-500 transition-colors hover:text-crimson-400">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
