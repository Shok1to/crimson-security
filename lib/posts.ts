import fs from 'node:fs';
import path from 'node:path';

export interface PostHeading {
  id: string;
  text: string;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  author: string;
  /** Path under /public. */
  authorImage: string;
  /** ISO date (YYYY-MM-DD). */
  updated: string;
  /** Article HTML with an id on every h2. */
  html: string;
  headings: PostHeading[];
  readMinutes: number;
}

const WORDS_PER_MINUTE = 200;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stripTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');

function loadPost(meta: Pick<Post, 'slug' | 'title' | 'description' | 'author' | 'authorImage' | 'updated'>, file: string): Post {
  const raw = fs.readFileSync(path.join(process.cwd(), 'lib/posts', file), 'utf8');

  const headings: PostHeading[] = [];
  const html = raw.replace(/<h2>(.*?)<\/h2>/g, (_, inner: string) => {
    const text = stripTags(inner).replace(/\s+/g, ' ').trim();
    const id = slugify(text);
    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  const words = stripTags(raw).split(/\s+/).filter(Boolean).length;
  return { ...meta, html, headings, readMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) };
}

export function getPosts(): Post[] {
  return [
    loadPost(
      {
        slug: 'how-to-prepare-for-your-first-soc-2-audit',
        title: 'How to Prepare for Your First SOC 2 Audit',
        description:
          'The prerequisites, the order to work in, a worked example and the mistakes that cause the most delay on a first SOC 2 audit.',
        author: 'Richard Bangyay',
        authorImage: '/authors/richard.webp',
        updated: '2026-10-26',
      },
      'first-soc2-audit.html',
    ),
    loadPost(
      {
        slug: 'building-an-incident-response-plan-executives-will-use',
        title: 'Building an Incident Response Plan Executives Will Use',
        description:
          'What an executive-ready incident response plan contains, how to map it to Canadian compliance duties and test it, and how to choose a Canadian response partner.',
        author: 'Richard Bangyay',
        authorImage: '/authors/richard.webp',
        updated: '2026-10-26',
      },
      'incident-response-plan.html',
    ),
  ];
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
