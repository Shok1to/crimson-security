"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { navLinks } from "@/lib/site"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  // Only the home page has a dark hero for the header to sit transparently on.
  const isHome = usePathname() === "/"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const solid = scrolled || open || !isHome

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <header
        className={`relative transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
          solid
            ? "theme-light border-b border-edge/10 bg-ink-900/90 shadow-card-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
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
              src="/crimson-security-logo.svg"
              unoptimized
              alt=""
              width={174}
              height={50}
              priority
              className="h-[3.09375rem] w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 md:flex"
          >
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="group relative">
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1 font-display text-sm font-medium tracking-wide text-silver-300 transition-colors hover:text-silver-50 group-focus-within:text-silver-50"
                  >
                    {link.label}
                    <ChevronDown
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                    />
                  </Link>
                  {/* pt-3 bridges the gap so the menu stays open while the pointer travels to it */}
                  <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <ul className="theme-light min-w-52 rounded-xl border border-edge/10 bg-ink-900 p-2 shadow-card-sm">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block rounded-lg px-3 py-2 font-display text-sm font-medium text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-display text-sm font-medium tracking-wide text-silver-300 transition-colors hover:text-silver-50"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <button
            type="button"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-silver-100 transition-colors hover:bg-edge/5 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
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
                <li key={link.href} className="border-b border-edge/5">
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 font-display text-lg font-medium text-silver-100"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <ul className="-mt-2 mb-3 ml-3 border-l border-edge/10 pl-4">
                      {link.children.slice(1).map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="block py-2.5 font-display text-base font-medium text-silver-300"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </div>
  )
}
