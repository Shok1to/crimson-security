import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, Network, Radar, ShieldCheck } from 'lucide-react';
import LeafDivider from '@/components/LeafDivider';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { site, socialImageAlt } from '@/lib/site';

const TITLE = 'Vulnerability Assessment & Penetration Testing (VAPT)';
const DESCRIPTION =
  'Rigorous, objective security assessments from Crimson Security: quarterly vulnerability assessments and annual internal and external penetration testing to harden your infrastructure before adversaries strike.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/vapt' },
  // Restated in full: Next merges openGraph/twitter per key (see app/privacy/page.tsx).
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    siteName: site.name,
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    url: '/vapt',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: socialImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: socialImageAlt }],
  },
};

const cadence = [
  {
    title: 'Quarterly Vulnerability Assessments',
    body: 'Comprehensive, scheduled scans across all digital infrastructure to catch newly discovered CVEs, misconfigurations, missing security patches, and weak cipher suites before they can be leveraged by attackers.',
  },
  {
    title: 'Annual Penetration Testing (Internal & External Nodes)',
    body: 'In-depth, manual adversary simulations conducted at least once per year (or following major architectural overhauls) to validate whether identified vulnerabilities can be chained together to breach perimeter controls or compromise core assets.',
  },
];

const nodeTests = [
  {
    icon: Globe,
    n: '1',
    title: 'External Nodes Penetration Testing',
    subtitle: 'Perimeter Defense',
    simulates:
      'An external adversary attempting to breach your network from the public internet with zero insider knowledge or credentials.',
    targets:
      'Public-facing assets including corporate firewalls, VPN endpoints, web applications, customer portals, DNS servers, cloud perimeter services (AWS, Azure, GCP), and mail transfer agents.',
    objectives: [
      'Identify perimeter misconfigurations, exposed management ports, unpatched software, and weak authentication controls.',
      'Attempt initial compromise, credential harvesting, or remote code execution from outside the enterprise border.',
      'Verify that perimeter defenses (e.g., WAFs, IDS/IPS, edge routers) detect and actively drop malicious ingress traffic.',
    ],
  },
  {
    icon: Network,
    n: '2',
    title: 'Internal Nodes Penetration Testing',
    subtitle: 'Zero-Trust & Blast Radius',
    simulates:
      'A threat actor who has already bypassed perimeter defenses, such as through a successful phishing attack, supply chain compromise, rogue insider, or stolen remote-access credentials.',
    targets:
      'Assets residing within the private corporate network, including Active Directory/domain controllers, employee workstations, internal databases, local file shares, intranet applications, and industrial or IoT hardware.',
    objectives: [
      'Test network segmentation and determine whether an infected host can freely move laterally across VLANs.',
      'Evaluate privilege escalation pathways (e.g., abusing Kerberos tickets, local administrator password reuse, unconstrained delegation).',
      'Determine how deeply an attacker can penetrate toward "crown-jewel" assets before internal detection tooling (EDR, NDR, SIEM) flags the activity.',
    ],
  },
];

const comparison = [
  {
    dimension: 'Primary Goal',
    va: 'Catalog, prioritize, and report known system vulnerabilities.',
    pt: 'Exploit identified weaknesses to demonstrate real-world business impact.',
  },
  {
    dimension: 'Execution',
    va: 'Automated and semi-automated diagnostic scanning with expert verification.',
    pt: 'Manual, offensive adversary emulation using bespoke tools and tactics.',
  },
  {
    dimension: 'Scope',
    va: 'Broad scan across all internal and external network nodes.',
    pt: 'Targeted deep dive into exploitable attack chains and high-value targets.',
  },
  {
    dimension: 'Recommended Frequency',
    va: 'Quarterly (plus continuous post-patch scanning).',
    pt: 'Annually (or following significant infrastructure migrations).',
  },
  {
    dimension: 'Primary Deliverable',
    va: 'Prioritized remediation list organized by CVSS severity.',
    pt: 'Full narrative report detailing attack paths, proof-of-concept exploits, and strategic fixes.',
  },
];

const methodology = [
  {
    title: 'Reconnaissance & OSINT',
    body: 'Passive and active asset discovery, mapped across attack surfaces.',
  },
  {
    title: 'Threat Modeling & Vulnerability Analysis',
    body: 'Pinpointing exploitable vectors across system architectures and identity providers.',
  },
  {
    title: 'Exploitation & Lateral Movement',
    body: 'Safe, controlled ethical exploitation to confirm theoretical risk without causing operational disruption.',
  },
  {
    title: 'Post-Exploitation & Impact Scoping',
    body: 'Quantifying the blast radius by discovering what sensitive data or systems could be exposed.',
  },
  {
    title: 'Executive & Technical Reporting',
    body: 'Delivering two clear deliverables: an executive summary for leadership and board reporting, alongside detailed remediation blueprints for system administrators.',
  },
  {
    title: 'Remediation Validation',
    body: 'Complimentary re-testing of identified findings to verify that corrective patches and hardening measures were successfully applied.',
  },
];

const labelClass = 'font-display text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-crimson-300';

export default function VaptPage() {
  return (
    <div className="theme-light bg-ink-900">
      {/* hero */}
      <header className="mx-auto max-w-7xl px-5 pb-16 pt-36 sm:px-8 lg:pb-20">
        <p className="section-label">VAPT</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight text-silver-50 text-balance sm:text-5xl lg:text-6xl">
          Vulnerability Assessment{' '}
          <span className="text-crimson-gradient">&amp; Penetration Testing</span>
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-silver-300 sm:text-lg">
          Crimson Security provides rigorous, objective security assessments designed to uncover exploitable
          flaws, test operational defenses, and harden corporate infrastructure before adversaries strike.
          Combining automated intelligence with expert-led adversary simulation, our VAPT services give
          enterprise leaders complete visibility into their security posture.
        </p>
        <div className="mt-8">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-lg bg-crimson-600 px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-crimson-500"
          >
            <Radar className="h-4 w-4" aria-hidden="true" />
            Scope a VAPT engagement
          </Link>
        </div>
        <LeafDivider className="mt-12" />
      </header>

      {/* cadence */}
      <section aria-labelledby="cadence-heading" className="bg-ink-900 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            label="Strategic Testing Cadence"
            title={<span id="cadence-heading">Continuous assurance</span>}
            description="Cyber threats evolve continuously, and perimeter configurations shift with every release and deployment. To maintain robust cyber hygiene and satisfy regulatory and cyber insurance mandates, Crimson Security recommends a dual-track security cadence."
          />
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:gap-6">
            {cadence.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 0.08} className="h-full">
                <article className="hover-lift silver-border card-surface h-full rounded-2xl p-7 shadow-card-sm">
                  <h3 className="font-display text-xl font-bold leading-snug text-silver-50">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-silver-400">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* external vs internal */}
      <section aria-labelledby="nodes-heading" className="bg-ink-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            label="External vs. Internal"
            title={<span id="nodes-heading">Both sides of the firewall</span>}
            description="A complete penetration testing program evaluates an organization from both sides of the firewall. Understanding the distinction between external and internal nodes is essential to evaluating risk realistically."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {nodeTests.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.08} className="h-full">
                <article className="hover-lift silver-border card-surface h-full rounded-2xl p-7 shadow-card-sm">
                  <t.icon className="h-7 w-7 text-crimson-300" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-2xl font-bold leading-snug text-silver-50">
                    {t.n}. {t.title}
                  </h3>
                  <p className="text-sm text-silver-500">{t.subtitle}</p>

                  <p className={`${labelClass} mt-6`}>What it simulates</p>
                  <p className="mt-2 text-sm leading-relaxed text-silver-300">{t.simulates}</p>

                  <p className={`${labelClass} mt-5`}>Target nodes</p>
                  <p className="mt-2 text-sm leading-relaxed text-silver-300">{t.targets}</p>

                  <p className={`${labelClass} mt-5`}>Core objectives</p>
                  <ul className="leaf-list mt-3 grid gap-3 border-t border-edge/10 pt-4 text-sm text-silver-200">
                    {t.objectives.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VA vs PT */}
      <section aria-labelledby="compare-heading" className="bg-ink-900 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            label="Service Overview"
            title={<span id="compare-heading">Vulnerability Assessment vs. Penetration Testing</span>}
          />
          <Reveal className="mt-12">
            <div className="silver-border card-surface overflow-x-auto rounded-2xl shadow-card-sm">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <caption className="sr-only">Vulnerability Assessment compared with Penetration Testing</caption>
                <thead>
                  <tr className="border-b border-edge/10">
                    <th scope="col" className="p-5 font-display font-semibold text-silver-500">
                      Dimension
                    </th>
                    <th scope="col" className="p-5 font-display font-bold text-silver-50">
                      Vulnerability Assessment (VA)
                    </th>
                    <th scope="col" className="p-5 font-display font-bold text-silver-50">
                      Penetration Testing (PT)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.dimension} className="border-b border-edge/10 last:border-0 align-top">
                      <th scope="row" className="p-5 font-display font-semibold text-crimson-300">
                        {row.dimension}
                      </th>
                      <td className="p-5 leading-relaxed text-silver-300">{row.va}</td>
                      <td className="p-5 leading-relaxed text-silver-300">{row.pt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* methodology */}
      <section aria-labelledby="method-heading" className="bg-ink-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            label="The Crimson Methodology"
            title={<span id="method-heading">Built on recognized frameworks</span>}
            description="Our offensive security team operates under globally recognized industry frameworks, including PTES (Penetration Testing Execution Standard), OWASP, and NIST SP 800-115."
          />
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {methodology.map((step, i) => (
              <Reveal as="li" key={step.title} delay={(i % 3) * 0.08} className="h-full">
                <article className="hover-lift silver-border card-surface h-full rounded-2xl p-6 shadow-card-sm">
                  <p className="font-display text-sm font-semibold tabular-nums text-crimson-300">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug text-silver-50">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver-400">{step.body}</p>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* closing CTA */}
      <section aria-labelledby="vapt-cta-heading" className="bg-ink-900 py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <ShieldCheck className="mx-auto h-8 w-8 text-crimson-300" aria-hidden="true" />
          <h2
            id="vapt-cta-heading"
            className="mt-5 font-display text-3xl font-bold tracking-tight text-silver-50 text-balance sm:text-4xl"
          >
            Fortify your perimeter and internal network
          </h2>
          <p className="mt-5 leading-relaxed text-silver-300">
            Uncover your vulnerabilities before malicious actors exploit them. Contact Crimson Security to
            scope your quarterly vulnerability assessments and annual penetration testing schedule.
          </p>
          <Link
            href="/#contact"
            className="mt-8 inline-flex items-center rounded-lg bg-crimson-600 px-7 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-crimson-500"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
