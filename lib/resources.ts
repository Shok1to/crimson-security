import type { Metadata } from 'next';
import { site, socialImageAlt } from '@/lib/site';

/** Metadata for a page under /resources. Restated in full: Next merges openGraph/twitter per key (see app/privacy/page.tsx). */
export function resourceMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'en_CA',
      siteName: site.name,
      title: `${title} | ${site.name}`,
      description,
      url: path,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: socialImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${site.name}`,
      description,
      images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: socialImageAlt }],
    },
  };
}
