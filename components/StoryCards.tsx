import { BadgeCheck, CalendarClock, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Illustrative "floating card" graphics for the numbered story. The scope and team cards show
 * structure and policy only. The report card carries a *sample* prioritized checklist so
 * visitors can see what the deliverable looks like — it is illustrative, not client data.
 * Cards are decorative (aria-hidden) unless they contain content of their own.
 */

function CardShell({
  title,
  children,
  floatDelay = 0,
  decorative = true,
  maxWidth = 'max-w-md',
}: {
  title: string;
  children: ReactNode;
  floatDelay?: number;
  /** Hide from assistive tech. Set false when the card holds real text. */
  decorative?: boolean;
  maxWidth?: string;
}) {
  return (
    <div aria-hidden={decorative || undefined} className={`relative mx-auto w-full ${maxWidth}`}>
      {/* offset back card for depth */}
      <div className="absolute inset-0 translate-x-3 translate-y-4 rotate-[3deg] rounded-2xl border border-crimson-500/25 bg-crimson-500/10" />
      <div className="animate-float" style={{ animationDelay: `${floatDelay}s` }}>
        <div className="silver-border card-surface relative overflow-hidden rounded-2xl shadow-card">
          <div className="flex items-center gap-2 border-b border-edge/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-silver-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-silver-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-crimson-500" />
            <span className="ml-3 font-display text-xs uppercase tracking-[0.2em] text-silver-400">
              {title}
            </span>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* 01 — No Limit Policy ------------------------------------------------------ */

const scopeRows = [
  ['Devices', 'No limit'],
  ['Scans', 'No limit'],
  ['Scan tooling', 'Multiple tools'],
  ['Verification', 'Manual'],
  ['Testing', 'Full-knowledge'],
];

export function ScopeCard() {
  return (
    <CardShell title="assessment.scope">
      <ul className="divide-y divide-edge/5">
        {scopeRows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between py-3 text-sm">
            <span className="text-silver-400">{label}</span>
            <span className="inline-flex items-center gap-2 font-display font-semibold text-silver-50">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-crimson-400 animate-ping-soft" />
                <span className="relative h-2 w-2 rounded-full bg-crimson-400" />
              </span>
              {value}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <p className="mb-2 font-display text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
          Coverage
        </p>
        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
          {Array.from({ length: 48 }).map((_, i) => (
            <span
              key={i}
              className={`aspect-square rounded-[2px] bg-crimson-500 ${i % 11 === 3 ? 'animate-pixel' : ''}`}
              style={{
                opacity: 0.35 + ((i * 37) % 60) / 100,
                animationDelay: `${(i % 7) * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>
    </CardShell>
  );
}

/* 02 — No Hacker Policy / Owner accessibility -------------------------------- */

const teamRows = [
  { icon: BadgeCheck, title: 'Technicians', sub: 'CISSP / GIAC certified only' },
  { icon: UserCheck, title: 'Owner', sub: 'Present on assessments when possible' },
  { icon: CalendarClock, title: 'Schedule', sub: 'Off-hours & weekends, no extra cost' },
];

export function TeamCard() {
  return (
    <CardShell title="your.engagement" floatDelay={-2}>
      <ul className="space-y-3">
        {teamRows.map(({ icon: Icon, title, sub }) => (
          <li
            key={title}
            className="flex items-center gap-4 rounded-xl border border-edge/5 bg-edge/[0.02] p-3.5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-silver-400/30 bg-ink-800 text-silver-200">
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block font-display text-sm font-semibold text-silver-50">{title}</span>
              <span className="block text-sm text-silver-400">{sub}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        {['CISSP', 'GIAC'].map((c) => (
          <span
            key={c}
            className="rounded-full border border-silver-400/40 px-3.5 py-1 font-display text-xs font-semibold tracking-[0.2em] text-silver-200"
          >
            {c}
          </span>
        ))}
      </div>
    </CardShell>
  );
}

/* 03 — Detailed Reporting ---------------------------------------------------- */

const checklist: { priority: 'Critical' | 'High' | 'Medium'; text: string }[] = [
  {
    priority: 'Critical',
    text: 'Mandate immediate deployment of Multi-Factor Authentication (MFA) across all administrative and remote-access accounts to mitigate active breach risks.',
  },
  {
    priority: 'High',
    text: 'Approve the requested capital expenditure budget to replace unsupported, end-of-life legacy servers housing sensitive data.',
  },
  {
    priority: 'High',
    text: 'Authorize mandatory company-wide phishing and security awareness training to address vulnerabilities discovered in the detailed IT audit.',
  },
  {
    priority: 'Medium',
    text: 'Review and officially sign off on the updated quarterly Disaster Recovery and Business Continuity policy.',
  },
];

const chipStyle = {
  Critical: 'bg-crimson-600 text-white',
  High: 'border border-crimson-400/70 text-crimson-300',
  Medium: 'border border-silver-500/60 text-silver-300',
} as const;

export function ReportCard() {
  return (
    <CardShell title="assessment.report" floatDelay={-4} decorative={false} maxWidth="max-w-lg">
      <div className="flex gap-2">
        <span className="rounded-md bg-crimson-600/90 px-3 py-1.5 font-display text-xs font-semibold text-white">
          Executive
        </span>
        <span className="rounded-md border border-edge/10 px-3 py-1.5 font-display text-xs font-semibold text-silver-400">
          IT detail
        </span>
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-2.5 w-2/5 rounded bg-edge/20" />
        <div className="h-2 w-full rounded bg-edge/[0.07]" />
        <div className="h-2 w-11/12 rounded bg-edge/[0.07]" />
        <div className="h-2 w-3/4 rounded bg-edge/[0.07]" />
      </div>

      <p className="mb-2 mt-6 font-display text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
        Prioritized checklist
      </p>
      <ul className="space-y-4">
        {checklist.map((item) => (
          <li key={item.text} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-[0.2rem] h-4 w-4 shrink-0 rounded-[4px] border border-silver-500/60"
            />
            {/* Badge first in the DOM so it reads as "Critical: …"; sits to the right from sm up. */}
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:gap-3">
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 font-display text-[0.65rem] font-semibold tracking-wide sm:order-2 ${chipStyle[item.priority]}`}
              >
                {item.priority}
              </span>
              <p className="min-w-0 flex-1 text-[0.8rem] leading-snug text-silver-200 sm:order-1">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
