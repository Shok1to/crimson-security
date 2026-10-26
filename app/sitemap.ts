import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/posts';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/incident-response`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/resources`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/vapt`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...getPosts().map((p) => ({
      url: `${site.url}/resources/${p.slug}`,
      lastModified: new Date(p.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
