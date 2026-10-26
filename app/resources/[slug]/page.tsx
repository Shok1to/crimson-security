import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ReadWithAI from '@/components/ReadWithAI';
import { formatPostDate, getPost, getPosts } from '@/lib/posts';
import { site, socialImageAlt } from '@/lib/site';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  const path = `/resources/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: path },
    // Restated in full: Next merges openGraph/twitter per key (see app/privacy/page.tsx).
    openGraph: {
      type: 'article',
      locale: 'en_CA',
      siteName: site.name,
      title: `${post.title} | ${site.name}`,
      description: post.description,
      url: path,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: socialImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | ${site.name}`,
      description: post.description,
      images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: socialImageAlt }],
    },
  };
}

export default function ResourcePostPage({ params }: PageProps) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const url = `${site.url}/resources/${post.slug}`;

  return (
    <div className="theme-light bg-ink-900">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm text-silver-400 transition-colors hover:text-silver-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Resources
        </Link>

        <h1 className="mt-6 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-silver-50 text-balance sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-silver-400">
          <Image
            src={post.authorImage}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
          />
          <span className="font-medium text-silver-200">{post.author}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {formatPostDate(post.updated)}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readMinutes} min read</span>
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <article className="post-prose max-w-none" dangerouslySetInnerHTML={{ __html: post.html }} />

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <ReadWithAI url={url} title={post.title} />
            <p className="mt-8 font-display text-xs font-semibold uppercase tracking-wider text-silver-100">
              Table of contents
            </p>
            <ol className="mt-4 space-y-1 border-l border-edge/10">
              {post.headings.map((h, i) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-silver-400 transition-colors hover:border-crimson-500 hover:text-silver-50"
                  >
                    {i + 1}. {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
