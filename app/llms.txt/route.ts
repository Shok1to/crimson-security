import { differentiators, services } from '@/lib/content';
import { addressCityLine, site } from '@/lib/site';

/** Plain-text guide for LLMs and AI crawlers, per the llms.txt convention (llmstxt.org). */
export async function GET() {
  const serviceLines = services.map((s) => `- ${s.title}: ${s.summary}`).join('\n');
  const differentiatorLines = differentiators.map((d) => `- ${d.title}: ${d.description}`).join('\n');
  const locationLines = [addressCityLine, ...site.locations].map((l) => `- ${l}`).join('\n');

  const body = `# ${site.name}

> ${site.description}

## Company
${site.name} is a Canadian cybersecurity assessment and consulting firm. Technicians hold CISSP and GIAC
certifications, and the owner is present on assessments whenever possible.

Locations:
${locationLines}

Contact: ${site.emails.info} 

## Services
${serviceLines}

## Why Crimson Security
${differentiatorLines}

## Pages
- [Home](${site.url}/): services, capabilities, company differentiators and the contact form.
- [Privacy Policy](${site.url}/privacy): how personal information submitted through this website is
  collected, used and protected.

## Resources
- [Sitemap](${site.url}/sitemap.xml)
- [Robots](${site.url}/robots.txt)
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
