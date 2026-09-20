import Image from 'next/image';
import Link from 'next/link';
import { services } from '@/lib/content';
import { addressCityLine, site } from '@/lib/site';
import MapleLeaf from './MapleLeaf';

const company = [
  { label: 'Capabilities', href: '/#capabilities' },
  { label: 'Why Crimson', href: '/#why-crimson' },
  { label: 'Contact', href: '/#contact' },
  { label: 'Privacy Policy', href: '/privacy' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const linkClass = 'text-sm text-silver-400 transition-colors hover:text-white';

  return (
    <footer className="relative border-t border-edge/10 bg-ink-800">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Crimson Security — home">
              <Image
                src="/crimson-security-mark.png"
                alt=""
                width={56}
                height={56}
                sizes="56px"
                className="h-14 w-14 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="text-crimson-gradient font-display text-2xl font-bold tracking-tight">
                  Crimson
                </span>
                <span className="mt-1.5 font-display text-xs font-semibold uppercase tracking-[0.42em] text-silver-100">
                  Security
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-silver-400">
              {site.tagline}. Canadian cybersecurity assessment and consulting.
            </p>

            <h2 className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.25em] text-silver-200">
              Locations
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-silver-400">
              {site.locations.map((place) => (
                <li key={place} className="flex items-center gap-2.5">
                  <MapleLeaf className="h-3 w-3 shrink-0 text-crimson-400" />
                  {place}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Services">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-silver-200">
              Services
            </h2>
            <ul className="mt-5 space-y-3">
              {services.map((s) => (
                <li key={s.id}>
                  <Link href="/#services" className={linkClass}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-silver-200">
              Company
            </h2>
            <ul className="mt-5 space-y-3">
              {company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-silver-200">
              Contact
            </h2>
            <div className="mt-5 space-y-5 text-sm text-silver-400">
              <p>
                Call us now
                <br />
                <a
                  href={site.phone.href}
                  className="font-display text-lg font-bold text-white transition-colors hover:text-crimson-300"
                >
                  {site.phone.display}
                </a>
              </p>
              <ul className="space-y-2">
                {Object.values(site.emails).map((email) => (
                  <li key={email}>
                    <a href={`mailto:${email}`} className="break-all transition-colors hover:text-white">
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
              <address className="not-italic leading-relaxed">
                {site.address.street}
                <br />
                {addressCityLine}
              </address>
              <Link
                href="/#contact"
                className="inline-block font-semibold text-crimson-300 transition-colors hover:text-white"
              >
                Send us a message →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-edge/10 pt-8 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2.5 text-sm text-silver-500">
            <MapleLeaf className="h-3.5 w-3.5 shrink-0 text-crimson-400" />
            <span>© {year} Crimson Security. All rights reserved.</span>
          </p>
          <Link href="/privacy" className="text-sm text-silver-500 transition-colors hover:text-white">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
