'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navLinks, site } from '@/lib/site';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Only the home page has a dark hero for the header to sit transparently on.
  const isHome = usePathname() === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const solid = scrolled || open || !isHome;

  // The call bar only shows at the very top of the home page; it folds away once you scroll
  // (or on other pages, where the header is already solid) so the sticky header stays compact.
  const showBar = isHome && !scrolled;

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div
        className={`overflow-hidden bg-crimson-600 text-white motion-safe:transition-[max-height] motion-safe:duration-300 ${
          showBar ? 'max-h-10' : 'max-h-0'
        }`}
        aria-hidden={!showBar}
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-5 sm:justify-end sm:px-8">
          <a
            href={site.phone.href}
            tabIndex={showBar ? 0 : -1}
            className="inline-flex items-center gap-2 font-display text-[0.8rem] font-semibold tracking-wide text-white/95 transition-colors hover:text-white"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            <span>
              Call us now: <span className="font-bold">{site.phone.display}</span>
            </span>
          </a>
        </div>
      </div>

      <header
        className={`relative transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
          solid
            ? 'theme-light border-b border-edge/10 bg-ink-900/90 shadow-card-sm backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="Crimson Security — home"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/crimson-security-mark.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="flex flex-col leading-none">
              <span className="text-crimson-gradient font-display text-xl font-bold tracking-tight">
                Crimson
              </span>
              <span className="mt-1 font-display text-[0.62rem] font-semibold uppercase tracking-[0.42em] text-silver-100">
                Security
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-sm font-medium tracking-wide text-silver-300 transition-colors hover:text-silver-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-silver-100 transition-colors hover:bg-edge/5 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className="border-t border-edge/10 bg-ink-900 px-5 pb-6 pt-3 md:hidden"
          >
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-edge/5 py-4 font-display text-lg font-medium text-silver-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={site.phone.href}
              className="mt-5 flex items-center justify-center gap-2 font-display text-sm font-semibold text-silver-200"
            >
              <Phone className="h-4 w-4 text-crimson-400" aria-hidden="true" />
              Call us now: {site.phone.display}
            </a>
          </nav>
        )}
      </header>
    </div>
  );
}
