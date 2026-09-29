const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL

export const site = {
  name: "Crimson Security",
  tagline: "Practical Information Security",
  description:
    "Crimson Security is a Canadian cybersecurity firm offering compliance, penetration testing, monitoring and incident response by certified technicians.",
  /**
   * Set NEXT_PUBLIC_SITE_URL to the production domain. On Vercel we fall back to the
   * project's production URL automatically; locally we fall back to localhost.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercelProd ? `https://${vercelProd}` : "http://localhost:3000"),
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
