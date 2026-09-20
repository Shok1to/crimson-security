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
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercelProd ? `https://${vercelProd}` : 'http://localhost:3000'),
  /** Optional. Shown in the contact section + footer only when set. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined,
} as const;

export const navLinks = [
  { label: 'Services', href: '/#services' },
  { label: 'Capabilities', href: '/#capabilities' },
  { label: 'Why Crimson', href: '/#why-crimson' },
  { label: 'Contact', href: '/#contact' },
] as const;
