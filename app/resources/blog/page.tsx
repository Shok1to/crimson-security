import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/Reveal';
import ResourcesHeader from '@/components/ResourcesHeader';
import { formatPostDate, getPosts } from '@/lib/posts';
import { resourceMetadata } from '@/lib/resources';

const TITLE = 'Blog';
const DESCRIPTION =
  'Articles from Crimson Security on SOC 2 readiness, incident response planning and executive cybersecurity.';

export const metadata = resourceMetadata(TITLE, DESCRIPTION, '/resources/blog');

export default function BlogPage() {
  const posts = getPosts();

  return (
    <div className="theme-light bg-ink-900">
      <ResourcesHeader title={TITLE} intro={DESCRIPTION} section />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <ul className="grid gap-6 md:grid-cols-2">
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
