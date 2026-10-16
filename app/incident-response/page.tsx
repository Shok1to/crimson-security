import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Archive,
  ClipboardList,
  Fingerprint,
  Lock,
  Radio,
  ShieldAlert,
  Siren,
  Target,
  Unplug,
  type LucideIcon,
} from 'lucide-react';
import LeafDivider from '@/components/LeafDivider';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { site, socialImageAlt } from '@/lib/site';

const TITLE = 'Incident Management & Tactical Response';
const DESCRIPTION =
  'Enterprise-grade cyber resilience, rapid triage and strategic incident containment from Crimson Security, designed to minimize operational downtime and protect critical assets.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/incident-response' },
  // Restated in full: Next merges openGraph/twitter per key, so declaring either block
  // replaces the parent's entirely (see app/privacy/page.tsx).
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    siteName: site.name,
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    url: '/incident-response',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: socialImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: socialImageAlt }],
  },
};

interface Point {
  title: string;
  body: string;
}

interface Section {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  intro: string;
  points: Point[];
}

const sections: Section[] = [
  {
    id: 'policies',
    icon: ClipboardList,
    label: 'Incident Management Policies',
    title: 'High level',
    intro: 'A resilient cyber defense starts with governance and structural readiness before an event occurs.',
    points: [
      {
        title: 'Governance & Compliance Alignment',
        body: 'Standardized policies built on recognized cybersecurity frameworks (NIST SP 800-61, ISO/IEC 27035) to satisfy regulatory and cyber insurance mandates.',
      },
      {
        title: 'Roles & Responsibilities',
        body: 'Clearly designated Incident Command hierarchies, detailing internal reporting chains, executive oversight, legal counsel involvement, and communications teams.',
      },
      {
        title: 'Classification & Severity Matrix',
        body: 'Systematic impact criteria to categorize threats (Severity 1 critical breaches to low-level anomalies) ensuring appropriate resource allocation.',
      },
    ],
  },
  {
    id: 'response-plan',
    icon: Target,
    label: 'Incident Response Plan',
    title: 'Tactical',
    intro: 'When an active intrusion occurs, technical operations require scripted, step-by-step playbooks.',
    points: [
      {
        title: 'Triage & Scoping',
        body: 'Rapid assessment to identify patient zero, attack vectors, impacted subnets, and compromised user identities.',
      },
      {
        title: 'Operational Workflows',
        body: 'Actionable step-by-step workflows for security analysts and sysadmins to remediate active intrusions without disrupting unaffected systems.',
      },
      {
        title: 'Eradication & Remediation',
        body: 'Systematic elimination of malicious persistence mechanisms, rootkits, adversary backdoors, and compromised credentials.',
      },
      {
        title: 'Business Restoration',
        body: 'Safe, prioritized system re-introduction using clean baselines, enforced MFA, and enhanced network telemetry.',
      },
    ],
  },
  {
    id: 'immediate-response',
    icon: Siren,
    label: 'Immediate Response',
    title: 'The first 60 minutes',
    intro: 'The first 60 minutes of a security event determine the blast radius.',
    points: [
      {
        title: 'Rapid Deployment',
        body: '24/7 activation of the Crimson Incident Response Team to establish control of the environment.',
      },
      {
        title: 'Active Threat Suppression',
        body: 'Immediate intervention against active command-and-control (C2) communication channels and adversary movement.',
      },
      {
        title: 'Secure Communications Out-of-Band',
        body: 'Establishing encrypted, out-of-band channels for technical and executive incident teams to prevent eavesdropping by threat actors.',
      },
    ],
  },
  {
    id: 'evidence',
    icon: Fingerprint,
    label: 'Evidence Preservation',
    title: 'A legally defensible record',
    intro: 'Defending your business requires maintaining a legally defensible evidentiary record.',
    points: [
      {
        title: 'Forensic Volatile Memory Capture',
        body: 'Capturing active RAM states prior to rebooting or altering affected endpoints to preserve in-memory artifacts.',
      },
      {
        title: 'Forensic Disk Imaging',
        body: 'Generating write-blocked bitstream disk copies for offline analysis and reverse engineering.',
      },
      {
        title: 'Chain of Custody',
        body: 'Documented logging, cryptographic hashing, and chain-of-custody tracking suited for law enforcement, regulatory filings, and forensic audit.',
      },
      {
        title: 'Log Aggregation & Retention',
        body: 'Preserving SIEM logs, firewall events, and identity provider records to prevent malicious log wiping.',
      },
    ],
  },
  {
    id: 'ransomware',
    icon: Lock,
    label: 'Ransomware Strategy',
    title: 'Built for double extortion',
    intro: 'A specialized defense model tailored against modern double-extortion ransomware operators.',
    points: [
      {
        title: 'Air-Gapped & Immutable Backup Protection',
        body: 'Isolating and securing golden images and backup repositories before adversaries can encrypt or wipe them.',
      },
      {
        title: 'Extortion & Threat Actor Analysis',
        body: 'Identifying the ransomware variant, staging behavior, and indicators of exfiltration to determine data breach reporting requirements.',
      },
      {
        title: 'Decryption & Recovery Assessment',
        body: 'Verifying known decryptors, forensic viability, and infrastructure rebuild strategies to avoid ransom demands.',
      },
      {
        title: 'Business Continuity Execution',
        body: 'Activating segmented emergency workloads to maintain core business services during technical remediation.',
      },
    ],
  },
  {
    id: 'tabletop',
    icon: Radio,
    label: 'Tabletop Strategy',
    title: 'Rehearse before it is real',
    intro: 'Preparing teams through realistic scenario simulations before a live incident occurs.',
    points: [
      {
        title: 'Executive & Crisis Communications Drills',
        body: 'Simulating ransom negotiations, customer communication, and regulatory disclosure pressures for the C-suite and board.',
      },
      {
        title: 'Technical Red/Blue Simulations',
        body: 'Hands-on operational drills for internal IT and SOC teams testing real-world attack behaviors.',
      },
      {
        title: 'After-Action Reporting & Gap Analysis',
        body: 'Comprehensive assessments evaluating process bottlenecks, metric tracking (MTTD/MTTR), and actionable updates to the live Incident Response Plan.',
      },
    ],
  },
];

const containment = [
  {
    icon: Unplug,
    title: 'Unplug',
    subtitle: 'Physical & network disconnection',
    items: [
      'Disconnect physical Ethernet cables and sever Wi-Fi connections immediately.',
      'Do not power down or reboot endpoints, preserving volatile data and memory residency.',
    ],
  },
  {
    icon: ShieldAlert,
    title: 'Isolate',
    subtitle: 'Network & logical segmentation',
    items: [
      'Enforce EDR host isolation to restrict an infected device strictly to administrative telemetry channels.',
      'Revoke active Kerberos and OAuth sessions, lock compromised service accounts, and blackhole suspicious external IP traffic at perimeter firewalls.',
      'Segment sensitive VLANs to quarantine lateral traversal tools and prevent domain-wide privilege escalation.',
    ],
  },
];

function PointCard({ point }: { point: Point }) {
  return (
    <article className="hover-lift silver-border card-surface h-full rounded-2xl p-6 shadow-card-sm">
      <h3 className="font-display text-lg font-bold leading-snug text-silver-50">{point.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-silver-400">{point.body}</p>
    </article>
  );
}

export default function IncidentResponsePage() {
  // Containment is section 5, so the numbered sections before and after it are offset.
  const numberFor = (i: number) => String(i < 4 ? i + 1 : i + 2);

  return (
    <div className="theme-light bg-ink-900">
      {/* hero */}
      <header className="mx-auto max-w-7xl px-5 pb-16 pt-36 sm:px-8 lg:pb-20">
        <p className="section-label">Incident Response</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight text-silver-50 text-balance sm:text-5xl lg:text-6xl">
          Incident Management <span className="text-crimson-gradient">&amp; Tactical Response</span>
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-silver-300 sm:text-lg">
          Crimson Security delivers enterprise-grade cyber resilience, rapid triage, and strategic incident
          containment designed to minimize operational downtime and protect critical assets.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-lg bg-crimson-600 px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-crimson-500"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            Report an incident
          </Link>
          <a
            href={`mailto:${site.emails.info}`}
            className="inline-flex items-center rounded-lg border border-edge/20 px-6 py-3 font-display text-sm font-semibold text-silver-100 transition-colors hover:bg-edge/5"
          >
            {site.emails.info}
          </a>
        </div>
        <LeafDivider className="mt-12" />
      </header>

      {/* numbered sections, with containment slotted in as section 5 */}
      {[...sections.slice(0, 4), null, ...sections.slice(4)].map((section, i) => {
        if (!section) {
          return (
            <section
              key="containment"
              id="containment"
              aria-labelledby="containment-heading"
              className="bg-ink-950 py-20 lg:py-24"
            >
              <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <SectionHeading
                  label="5. Containment"
                  title={<span id="containment-heading">Unplug &amp; Isolate</span>}
                  description="Effective containment prevents lateral movement across hybrid infrastructure while retaining vital operational state."
                />
                <div className="mt-12 grid gap-6 lg:grid-cols-2">
                  {containment.map((group, g) => (
                    <Reveal key={group.title} delay={g * 0.08} className="h-full">
                      <article className="hover-lift silver-border card-surface h-full rounded-2xl p-7 shadow-card-sm">
                        <group.icon className="h-7 w-7 text-crimson-300" aria-hidden="true" />
                        <h3 className="mt-4 font-display text-2xl font-bold text-silver-50">{group.title}</h3>
                        <p className="text-sm text-silver-500">{group.subtitle}</p>
                        <ul className="leaf-list mt-5 grid gap-3 border-t border-edge/10 pt-5 text-sm text-silver-200">
                          {group.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        const n = numberFor(i);
        return (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className={`py-20 lg:py-24 ${i % 2 === 0 ? 'bg-ink-900' : 'bg-ink-950'}`}
          >
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <SectionHeading
                label={`${n}. ${section.label}`}
                title={<span id={`${section.id}-heading`}>{section.title}</span>}
                description={section.intro}
              />
              <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:gap-6">
                {section.points.map((point, p) => (
                  <Reveal as="li" key={point.title} delay={(p % 2) * 0.08} className="h-full">
                    <PointCard point={point} />
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      {/* closing CTA */}
      <section aria-labelledby="ir-cta-heading" className="bg-ink-900 py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Archive className="mx-auto h-8 w-8 text-crimson-300" aria-hidden="true" />
          <h2
            id="ir-cta-heading"
            className="mt-5 font-display text-3xl font-bold tracking-tight text-silver-50 sm:text-4xl text-balance"
          >
            Secure your organization with Crimson Security
          </h2>
          <p className="mt-5 leading-relaxed text-silver-300">
            Whether responding to an active intrusion or pressure-testing your response protocols, Crimson
            Security equips your organization with rapid containment, forensic rigor, and proven recovery
            strategies. Contact our Incident Management team to establish incident readiness.
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
