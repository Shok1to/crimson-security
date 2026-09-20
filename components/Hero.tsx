import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HeroBackground from './HeroBackground';

/** CSS-only entrance so the logo (LCP) never waits on hydration. */
const rise = (delay: number) => ({ animationDelay: `${delay}s` });

export default function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-20 pt-28"
    >
      <HeroBackground />

      <div className="relative mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
        <div className="animate-rise relative isolate" style={rise(0.05)}>
          {/* The logo's maroon wordmark needs a darker seat than the crimson hero behind it. */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-16 -inset-y-14 -z-10"
            style={{
              background:
                'radial-gradient(closest-side, rgba(14,6,8,0.92) 0%, rgba(14,6,8,0.7) 55%, transparent 100%)',
            }}
          />
          <Image
            src="/crimson-security-logo-dark.png"
            alt="Crimson Security — Practical Information Security"
            width={1886}
            height={630}
            priority
            sizes="(min-width: 640px) 420px, 78vw"
            className="mx-auto h-auto w-[78vw] max-w-[420px] drop-shadow-[0_10px_50px_rgba(227,34,15,0.35)]"
          />
        </div>

        <h1
          id="hero-heading"
          className="animate-rise mt-10 font-display text-4xl font-bold leading-[1.08] tracking-tight text-silver-50 sm:text-5xl lg:text-6xl text-balance"
          style={rise(0.2)}
        >
          Find the gaps <span className="text-crimson-gradient">before they find you.</span>
        </h1>

        <p
          className="animate-rise mx-auto mt-6 max-w-2xl text-base leading-relaxed text-silver-300 sm:text-lg"
          style={rise(0.35)}
        >
          Canadian cybersecurity assessments and consulting — penetration testing, compliance, monitoring
          and incident response, delivered by CISSP- and GIAC-certified technicians.
        </p>

        <div
          className="animate-rise mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={rise(0.5)}
        >
          <Link
            href="/#contact"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-crimson-button px-8 py-4 font-display text-base font-semibold tracking-wide text-white shadow-crimson-cta transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-button-hover hover:shadow-crimson-cta-hover sm:w-auto"
          >
            Get in Touch
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/#services"
            className="inline-flex w-full items-center justify-center rounded-md border border-silver-400/40 px-8 py-4 font-display text-base font-semibold tracking-wide text-silver-100 transition-all duration-300 hover:border-crimson-400/70 hover:bg-crimson-600/10 hover:text-white sm:w-auto"
          >
            Learn More
          </Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 hidden justify-center sm:flex">
        <a
          href="#story"
          aria-label="Scroll to the next section"
          className="animate-rise flex flex-col items-center gap-2 text-silver-500 transition-colors hover:text-silver-200"
          style={rise(0.9)}
        >
          <span className="font-display text-[0.65rem] uppercase tracking-[0.35em]">Scroll</span>
          <span className="relative block h-9 w-px overflow-hidden bg-silver-600">
            <span className="absolute inset-x-0 top-0 h-3 bg-crimson-400 animate-float" />
          </span>
        </a>
      </div>
    </section>
  );
}
