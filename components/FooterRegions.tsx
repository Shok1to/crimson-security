"use client"

import { ChevronDown, Facebook, Globe, Instagram, type LucideIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { site } from "@/lib/site"
import MapleLeaf from "./MapleLeaf"

/** Regional offices; each opens a small menu of its website and social profiles. */
export default function FooterRegions() {
  const [openName, setOpenName] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!openName) return
    const onPointer = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node)) setOpenName(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenName(null)
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [openName])

  return (
    <ul ref={listRef} className="mt-4 space-y-2.5 text-sm text-silver-400">
      {site.regions.map((region) => {
        const open = openName === region.name
        const links: { label: string; href: string; icon: LucideIcon }[] = []
        if ("website" in region) links.push({ label: "Website", href: region.website, icon: Globe })
        links.push(
          { label: "Facebook", href: region.facebook, icon: Facebook },
          { label: "Instagram", href: region.instagram, icon: Instagram },
        )

        return (
          <li key={region.name} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpenName(open ? null : region.name)}
              className="flex items-center gap-2.5 transition-colors hover:text-white"
            >
              <MapleLeaf className="h-3 w-3 shrink-0 text-crimson-400" />
              {region.name}
              <ChevronDown
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <ul className="absolute left-5 top-full z-20 mt-2 min-w-44 rounded-xl border border-edge/10 bg-ink-900 p-1.5 shadow-card-sm">
                {links.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpenName(null)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 font-display font-medium text-silver-300 transition-colors hover:bg-edge/5 hover:text-silver-50"
                    >
                      <Icon className="h-4 w-4 text-crimson-400" aria-hidden="true" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
