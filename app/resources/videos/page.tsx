import Reveal from '@/components/Reveal';
import ResourcesHeader from '@/components/ResourcesHeader';
import { resourceMetadata } from '@/lib/resources';

const TITLE = 'Videos';
const DESCRIPTION = 'Watch Crimson Security Canada explain who we are and how we help organizations stay secure.';

export const metadata = resourceMetadata(TITLE, DESCRIPTION, '/resources/videos');

const videos = [{ id: 'AhQ2UVo1xHU', title: 'Welcome to Crimson Security Canada' }];

export default function VideosPage() {
  return (
    <div className="theme-light bg-ink-900">
      <ResourcesHeader title={TITLE} intro={DESCRIPTION} section />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <ul className="grid gap-6 md:grid-cols-2">
          {videos.map((video, i) => (
            <Reveal as="li" key={video.id} delay={i * 0.08}>
              <div className="overflow-hidden rounded-2xl border border-edge/10 bg-ink-800 shadow-card-sm">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
                <h2 className="p-6 font-display text-xl font-semibold leading-snug text-silver-50 text-balance">
                  {video.title}
                </h2>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
    </div>
  );
}
