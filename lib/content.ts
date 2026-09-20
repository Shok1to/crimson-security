import {
  Activity,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  Crosshair,
  FileCheck2,
  FileText,
  Fingerprint,
  Handshake,
  Headset,
  Infinity as InfinityIcon,
  MonitorSmartphone,
  ScanSearch,
  Siren,
  UserCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Services                                                                   */
/*  Sourced from the brief / crimsonsecurityinc.com — do not add services the  */
/*  firm doesn't offer.                                                        */
/* -------------------------------------------------------------------------- */

export type ServiceId =
  | 'compliance'
  | 'pentest'
  | 'soc'
  | 'scanning'
  | 'vendor'
  | 'ir'
  | 'forensics'
  | 'siem';

export type ServiceCategory = 'Assess' | 'Test' | 'Monitor' | 'Respond';

export interface Service {
  id: ServiceId;
  title: string;
  icon: LucideIcon;
  /** Same four disciplines as the capability tabs. */
  category: ServiceCategory;
  /** Spans two columns in the services bento grid. */
  wide?: boolean;
  summary: string;
  points: string[];
}

export const services: Service[] = [
  {
    id: 'compliance',
    title: 'Compliance Assessments & Reports',
    icon: ClipboardCheck,
    category: 'Assess',
    wide: true,
    summary: 'Framework-based assessments and reports against the standards your business answers to.',
    points: ['PCI', 'ISO 27002 / GLBA / HIPAA', 'NIST 800-53', 'FERC / NERC', 'BITS / COBRA'],
  },
  {
    id: 'pentest',
    title: 'Penetration Testing',
    icon: Crosshair,
    category: 'Test',
    summary: 'Hands-on testing of your infrastructure with full knowledge of the environment.',
    points: ['Full-knowledge penetration tests', 'Comprehensive breach and leak reporting'],
  },
  {
    id: 'soc',
    title: 'SSAE 16 / SOC Audits',
    icon: FileCheck2,
    category: 'Assess',
    summary: 'SOC audits, delivered through our partner accounting firms.',
    points: ['SSAE 16 / SOC audits', 'Partner accounting firms'],
  },
  {
    id: 'scanning',
    title: 'Vulnerability Scanning',
    icon: ScanSearch,
    category: 'Test',
    summary: 'Scanning from the inside and the outside, with results checked by a person.',
    points: ['Internal and external scanning', 'Multi-tool coverage', 'Manual verification'],
  },
  {
    id: 'vendor',
    title: 'Vendor Security Management',
    icon: Handshake,
    category: 'Monitor',
    summary: 'Know how secure your vendors and partners really are — and keep them accountable.',
    points: ['Evaluate and rate vendors', 'Manage vendor and partner remediation'],
  },
  {
    id: 'ir',
    title: 'Incident Response Services',
    icon: Siren,
    category: 'Respond',
    wide: true,
    summary: 'Be ready before an incident, and supported through it.',
    points: ['IR planning', 'Training and testing', 'Containment and recovery support'],
  },
  {
    id: 'forensics',
    title: 'Forensic Analysis Services',
    icon: Fingerprint,
    category: 'Respond',
    wide: true,
    summary: 'Get answers when something looks wrong.',
    points: ['Comprehensive analysis on suspected incidents'],
  },
  {
    id: 'siem',
    title: 'Security Monitoring / SIEM',
    icon: Activity,
    category: 'Monitor',
    wide: true,
    summary: 'Monitoring you can stand up, staff and trust to escalate.',
    points: [
      'SIEM implementation',
      'Staff training',
      'Alert escalation',
      'Log, IDS / IPS and antivirus monitoring',
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Numbered story                                                             */
/* -------------------------------------------------------------------------- */

export const story = [
  {
    n: '01',
    eyebrow: 'No Limit Policy',
    title: 'Full coverage, with no meter running.',
    body: 'We assess your whole environment — no caps on devices, no caps on scans. Scanner output is verified by hand, and penetration tests are run with full knowledge of your systems.',
    points: [
      'No device or scan limits',
      'Internal and external scanning with multiple tools',
      'Full-knowledge penetration testing',
    ],
    visual: 'scope',
  },
  {
    n: '02',
    eyebrow: 'No Hacker Policy',
    title: 'Certified professionals, with the owner at the table.',
    body: 'Your systems are handled only by CISSP- and GIAC-certified technicians, and the owner is present on assessments whenever possible.',
    points: [
      'CISSP / GIAC-certified technicians only',
      'Owner present on assessments when possible',
      'Off-hours and weekend work at no extra cost',
    ],
    visual: 'team',
  },
  {
    n: '03',
    eyebrow: 'Detailed Reporting',
    title: 'Reports you can act on — and help acting on them.',
    body: 'Executive-level and IT-level reports come with prioritized checklists, backed by remediation assistance and ongoing technical support.',
    points: [
      'Executive- and IT-level reporting',
      'Prioritized remediation checklists',
      'Remediation assistance and Mon–Fri technical support',
    ],
    visual: 'report',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Tabbed capabilities                                                        */
/* -------------------------------------------------------------------------- */

export interface CapabilityTab {
  id: 'assess' | 'test' | 'monitor' | 'respond';
  label: string;
  headline: string;
  description: string;
  services: ServiceId[];
  highlights: string[];
}

export const capabilityTabs: CapabilityTab[] = [
  {
    id: 'assess',
    label: 'Assess & Comply',
    headline: 'Know where you stand against the standards that matter.',
    description:
      'We assess your controls against the frameworks you answer to and deliver reports written for both executives and IT. Remote pre-audit preparation gets you ready before the formal assessment begins, and SOC audits are delivered through our partner accounting firms.',
    services: ['compliance', 'soc'],
    highlights: ['Remote pre-audit preparation', 'Executive and IT-level reports', 'Remediation assistance'],
  },
  {
    id: 'test',
    label: 'Test & Scan',
    headline: 'Find the weaknesses before someone else does.',
    description:
      'Full-knowledge penetration tests and multi-tool internal and external vulnerability scans, with results verified manually. Our No Limit Policy means coverage is never trimmed to fit a device or scan count.',
    services: ['pentest', 'scanning'],
    highlights: ['No device or scan limits', 'Manual verification', 'Breach and leak reporting'],
  },
  {
    id: 'monitor',
    label: 'Monitor & Manage',
    headline: 'Keep watch on your environment — and your vendors.',
    description:
      'We implement SIEM, train your staff and set up alert escalation across logs, IDS/IPS and antivirus. Vendor Security Management evaluates and rates your vendors and partners, then manages their remediation.',
    services: ['siem', 'vendor'],
    highlights: ['SIEM implementation', 'Staff training', 'Vendor and partner ratings'],
  },
  {
    id: 'respond',
    label: 'Respond & Recover',
    headline: 'Be ready when something goes wrong.',
    description:
      'Incident response planning, training and testing before an event; containment and recovery support during one; and comprehensive forensic analysis of suspected incidents.',
    services: ['ir', 'forensics'],
    highlights: ['IR planning, training and testing', 'Containment and recovery support', 'Forensic analysis'],
  },
];

/* -------------------------------------------------------------------------- */
/*  Stats                                                                      */
/* -------------------------------------------------------------------------- */

export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Static text appended after the counted number (e.g. the "/7" in 24/7). */
  tail?: string;
  label: string;
}

export const stats: Stat[] = [
  { value: 10000, suffix: '+', label: 'Customers satisfied' },
  { value: 18, suffix: '+', label: 'Years of experience' },
  { value: 24, tail: '/7', label: 'Availability & support' },
  { value: 100, prefix: '$', suffix: 'M+', label: 'ROI delivered for clients' },
];

/* -------------------------------------------------------------------------- */
/*  Differentiators                                                            */
/* -------------------------------------------------------------------------- */

export interface Differentiator {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const differentiators: Differentiator[] = [
  {
    title: 'Remote Pre-Audit Preparation',
    description: 'Prepare for your audit remotely, so the formal assessment runs smoothly.',
    icon: MonitorSmartphone,
  },
  {
    title: 'Remediation Assistance',
    description: 'Help closing the gaps we find — not just a list of them.',
    icon: Wrench,
  },
  {
    title: 'No Limit Policy',
    description: 'Full-coverage assessment with no device or scan limits.',
    icon: InfinityIcon,
  },
  {
    title: 'Detailed Reporting',
    description: 'Executive-level and IT-level reports with prioritized checklists.',
    icon: FileText,
  },
  {
    title: 'Flexibility',
    description: 'Off-hours and weekend assessments at no extra cost.',
    icon: CalendarClock,
  },
  {
    title: 'No Hacker Policy',
    description: 'CISSP- and GIAC-certified technicians only.',
    icon: BadgeCheck,
  },
  {
    title: 'Ongoing Technical Support',
    // U+2060 word joiners keep "9am–5pm" from breaking across lines at the dash.
    description: 'Technical support Monday to Friday, 9am\u2060–\u20605pm.',
    icon: Headset,
  },
  {
    title: 'Owner Accessibility',
    description: 'The owner is present on assessments whenever possible.',
    icon: UserCheck,
  },
  {
    title: 'Real World References',
    description: 'Client references in verticals similar to yours.',
    icon: Users,
  },
];
