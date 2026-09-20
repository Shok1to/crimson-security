# Crimson Security — marketing site

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion. Deploys to Vercel with zero config.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Before launch

| Item | Where | Notes |
| --- | --- | --- |
| Contact delivery | `app/api/contact/route.ts` | **Placeholder.** Validates and screens bots, but does not send the message anywhere. Add an email/CRM call at the `TODO`. |
| Site URL | `NEXT_PUBLIC_SITE_URL` (Vercel env) | Used for canonical, OG and sitemap URLs. Falls back to Vercel's production URL, then localhost. |
| Contact details | `lib/site.ts` | Phone (1-800-123-4567), info@crimsonsecurityinc.ca, the Toronto address and the four locations live here and feed the top call bar, contact section, footer, privacy page and JSON-LD. **Confirm the phone number and mailboxes are live before launch.** |
| Privacy policy | `app/privacy/page.tsx` | Draft that describes only what the site does today. Have counsel review it. |

## Where things live

- `lib/content.ts` — all services, story blocks, tabs, stats and differentiators. Edit copy here.
- `lib/site.ts` — name, description, URL, nav links, and all contact details (phone, emails, address, locations).
- `tailwind.config.ts` — palette sampled from the logo (`crimson`, `silver`, `ink`).
- `app/globals.css` — section themes. Neutral colours are CSS variables; add `theme-light` to a section to flip it to white/gray, `theme-crimson` for the crimson band, or nothing for dark. Page rhythm (SentinelOne-style): dark crimson hero → light story → light-gray services → dark capabilities → crimson stats → light differentiators → light-gray contact → dark footer.
- `components/Reveal.tsx`, `CountUp.tsx` — scroll-triggered animation primitives (IntersectionObserver-based).
- `components/CircuitTexture.tsx`, `PixelField.tsx` — the shield's circuit/pixel motif as background texture.
- `public/crimson-security-logo.png` — original logo (for light backgrounds / JSON-LD).
- `public/crimson-security-logo-dark.png` — same logo with the charcoal "SECURITY" wordmark and tagline recoloured for dark backgrounds, and the pale ground-shadow removed.
- `public/crimson-security-mark.png` — shield + leaf only; source for `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`.
- `app/opengraph-image.png` / `twitter-image.png` — 1200×630 social card.

## Motion & accessibility

- All Framer Motion animation runs under `<MotionConfig reducedMotion="user">`; CSS animations are switched off in a `prefers-reduced-motion: reduce` block in `app/globals.css`.
- Hero entrance is CSS-only so the logo (LCP) never waits on hydration. Scroll reveals fall back to visible with JS disabled.
- Tabs follow the WAI-ARIA tabs pattern (roving tabindex, arrow/Home/End keys).
