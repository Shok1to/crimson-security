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
| Chat assistant | `app/api/chat/route.ts` | Needs `ANTHROPIC_API_KEY` and `RESEND_API_KEY`. **`CHAT_ENABLED` defaults off** — set it to `true` to serve. Rate limiting is in-memory per instance (see the design doc); move to Redis if the endpoint draws traffic. |
| Contact delivery | `app/api/contact/route.ts`, `lib/enquiry-delivery.ts` | Delivers via Resend. Requires `RESEND_API_KEY`; the route returns 500 when delivery fails rather than reporting false success. **Not yet verified against the live Resend API — see issue #11.** |
| Sender address | `RESEND_FROM_EMAIL` | The `From:` on every enquiry. Must be an address on a domain **verified in Resend**, or the send is rejected. Falls back to `website@crimsonsecurityinc.ca`. |
| Enquiry briefing | `lib/lead-analysis.ts` | Haiku reads each enquiry and writes a summary, likely service, urgency, open questions and a **draft reply** into the email. Advisory only, labelled as such, and never sent to anyone automatically. Needs `ANTHROPIC_API_KEY`; without it, or on any failure, the enquiry still sends with the briefing omitted. |
| Contact details | `lib/site.ts` | info@crimsonsecurityinc.ca, the Toronto address and the four locations live here and feed the contact section, footer, privacy page and JSON-LD. **Confirm the mailboxes are live before launch.** |
| Site URL | `NEXT_PUBLIC_SITE_URL` (Vercel env) | Used for canonical, OG and sitemap URLs. Still worth setting explicitly, but it now falls back to `https://crimsonsecurityinc.ca` on any Vercel deploy, then localhost — so leaving it unset degrades safely instead of publishing canonicals that point at a `*.vercel.app` URL. Set it only to override, e.g. on a staging deploy. |
| Privacy policy | `app/privacy/page.tsx` | Draft that describes only what the site does today. Have counsel review it. |

## Where things live

- `lib/content.ts` — all services, story blocks, tabs, stats and differentiators. Edit copy here.
- `lib/site.ts` — name, description, URL, nav links, and all contact details (emails, address, locations).
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