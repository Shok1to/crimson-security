const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: 'Crimson Security',
  tagline: 'Practical Information Security',
  description:
    'Crimson Security is a Canadian cybersecurity assessment and consulting firm offering compliance assessments, penetration testing, vulnerability scanning, SOC audits, incident response, forensics and SIEM — delivered by CISSP/GIAC-certified technicians.',
  /**
   * Set NEXT_PUBLIC_SITE_URL to the production domain. On Vercel we fall back to the
   * project's production URL automatically; locally we fall back to localhost.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (vercelProd ? `https://${vercelProd}` : 'http://localhost:3000'),
  /** Single source of truth for contact details: top bar, contact section, footer, privacy page, JSON-LD. */
  phone: {
    display: '1-800-123-4567',
    href: 'tel:+18001234567',
  },
  emails: {
    info: 'info@crimsonsecurityinc.ca',
  },
  address: {
    street: '325 Front St. W., 4th Floor',
    locality: 'Toronto',
    region: 'Ontario',
    regionCode: 'ON',
    country: 'Canada',
    countryCode: 'CA',
    postalCode: 'M5V 2Y1',
  },
  locations: ['Virginia, USA', 'Reykjavik, Iceland', 'Frankfurt, Germany', 'Cebu, Philippines'],
} as const;

/** Second address line, e.g. "Toronto, Ontario, Canada M5V 2Y1". */
export const addressCityLine = `${site.address.locality}, ${site.address.region}, ${site.address.country} ${site.address.postalCode}`;

export const navLinks = [
  { label: 'Services', href: '/#services' },
  { label: 'Capabilities', href: '/#capabilities' },
  { label: 'Why Crimson', href: '/#why-crimson' },
  { label: 'Contact', href: '/#contact' },
] as const;
