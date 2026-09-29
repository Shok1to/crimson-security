/**
 * The production domain, and the same property as the info@ address below.
 *
 * NO TRAILING SLASH. `site.url` is concatenated in six places — the JSON-LD
 * logo and image, `${site.url}/privacy`, `${site.url}/sitemap.xml` in robots,
 * and llms.txt — so a slash here produces `//privacy`.
 */
const PRODUCTION_URL = "https://crimsonsecurityinc.ca"

/**
 * Resolves the origin every canonical, og:url, sitemap entry and JSON-LD URL is
 * built from.
 *
 * 1. NEXT_PUBLIC_SITE_URL wins, so a staging deploy can point at itself.
 * 2. On Vercel without it, the production domain. This used to be the Vercel
 *    project URL, which meant an unset variable silently published canonicals
 *    pointing at `*.vercel.app` instead of the real domain — wrong canonicals
 *    and a duplicate-content signal, with nothing to notice.
 * 3. Otherwise localhost, for local development.
 *
 * Either Vercel variable counts as "deployed": presence is all that is needed
 * now that the value is not used, and falling through to localhost on a real
 * deploy is the one outcome worth ruling out twice.
 *
 * A trailing slash is stripped from NEXT_PUBLIC_SITE_URL too, because the
 * natural way to write a domain includes one and every consumer concatenates.
 */
export function resolveSiteUrl(env: {
  NEXT_PUBLIC_SITE_URL?: string
  VERCEL?: string
  VERCEL_PROJECT_PRODUCTION_URL?: string
}): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, "")

  const onVercel = Boolean(env.VERCEL || env.VERCEL_PROJECT_PRODUCTION_URL)
  return onVercel ? PRODUCTION_URL : "http://localhost:3000"
}

export const site = {
  name: "Crimson Security",
  tagline: "Practical Information Security",
  description:
    "Crimson Security is a Canadian cybersecurity firm offering compliance, penetration testing, monitoring and incident response by certified technicians.",
  /** See resolveSiteUrl above for the precedence. */
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  }),
  /** Single source of truth for contact details: top bar, contact section, footer, privacy page, JSON-LD. */
  emails: {
    info: "info@crimsonsecurityinc.ca",
  },
  address: {
    street: "325 Front St. W., 4th Floor",
    locality: "Toronto",
    region: "Ontario",
    regionCode: "ON",
    country: "Canada",
    countryCode: "CA",
    postalCode: "M5V 2Y1",
  },
  locations: [
    "Virginia, USA",
    "Reykjavik, Iceland",
    "Frankfurt, Germany",
    "Cebu, Philippines",
  ],
} as const

/**
 * Alt text for the social share images.
 *
 * The root layout gets this from the file convention
 * (app/opengraph-image.alt.txt and app/twitter-image.alt.txt). Any page that
 * declares its own openGraph or twitter block loses the file-convention image
 * and has to restate it, so the string lives here once and
 * tests/social-metadata.test.ts asserts it still matches both files byte for
 * byte.
 */
export const socialImageAlt = `${site.name} — ${site.tagline}. Canadian cybersecurity assessments and consulting.`

/** Second address line, e.g. "Toronto, Ontario, Canada M5V 2Y1". */
export const addressCityLine = `${site.address.locality}, ${site.address.region}, ${site.address.country} ${site.address.postalCode}`

export const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Why Crimson", href: "/#why-crimson" },
  { label: "Contact", href: "/#contact" },
] as const
