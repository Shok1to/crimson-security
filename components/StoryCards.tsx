import type { ReactNode } from 'react';

/**
 * Illustrative "floating card" graphics for the numbered story. The scope and team cards are
 * diagrams that *show* the claim (capped vs full coverage; certified people only) rather than
 * repeat the text beside them. The report card carries a *sample* prioritized checklist so
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

const GRID_CELLS = 30; // 6 × 5

/** A block of "devices": filled = scanned, dashed = never reached. */
function CoverageGrid({ scanned }: { scanned: number }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {Array.from({ length: GRID_CELLS }).map((_, i) => (
        <span
          key={i}
          className={`aspect-square rounded-[3px] ${
            i < scanned ? 'bg-crimson-500' : 'border border-dashed border-silver-500/60'
          }`}
        />
      ))}
    </div>
  );
}

/** What a device or scan cap leaves behind, next to what no cap looks like. */
export function ScopeCard() {
  return (
    <CardShell title="assessment.scope">
      <div className="grid grid-cols-2 gap-6">
        <figure>
          <figcaption className="mb-3 font-display text-[0.65rem] uppercase tracking-[0.25em] text-silver-500">
            With a cap
          </figcaption>
          <CoverageGrid scanned={11} />
        </figure>
        <figure>
          <figcaption className="mb-3 font-display text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-crimson-300">
            No limit
          </figcaption>
          <CoverageGrid scanned={GRID_CELLS} />
        </figure>
      </div>

      <div className="mt-5 flex items-center gap-6 border-t border-edge/10 pt-4 text-xs text-silver-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-crimson-500" />
          Scanned
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[2px] border border-dashed border-silver-500/70" />
          Never reached
        </span>
      </div>
    </CardShell>
  );
}

/* 02 — No Hacker Policy ------------------------------------------------------ */

/** Simple person glyph: head + shoulders, centred on (cx, cy). */
function Person({ cx, cy, className }: { cx: number; cy: number; className: string }) {
  return (
    <g className={className}>
      <circle cx={cx} cy={cy - 6} r="6" />
      <path d={`M${cx - 11} ${cy + 13} q0 -13 11 -13 q11 0 11 13 z`} />
    </g>
  );
}

const techs = [
  { x: 64, cert: 'CISSP' },
  { x: 144, cert: 'GIAC' },
  { x: 224, cert: 'CISSP' },
];

/** An engagement team: the owner oversees certified technicians; an uncertified person is left out. */
export function TeamCard() {
  const font = 'font-display';
  return (
    <CardShell title="your.engagement" floatDelay={-2}>
      <svg viewBox="0 0 360 268" className={`h-auto w-full ${font}`} role="presentation" focusable="false">
        {/* owner -> technicians */}
        {techs.map((t) => (
          <path
            key={`o-${t.x}`}
            d={`M180 66 V94 H${t.x} V119`}
            className="fill-none stroke-crimson-500"
            strokeOpacity="0.55"
            strokeDasharray="3 4"
          />
        ))}
        {/* technicians -> your systems */}
        {techs.map((t) => (
          <path
            key={`s-${t.x}`}
            d={`M${t.x} 191 V206 H180`}
            className="fill-none stroke-silver-500"
            strokeOpacity="0.5"
          />
        ))}
        <path d="M180 206 V217" className="fill-none stroke-silver-500" strokeOpacity="0.5" />

        {/* owner */}
        <circle cx="180" cy="38" r="27" className="fill-ink-800 stroke-crimson-500" strokeWidth="1.6" />
        <Person cx={180} cy={38} className="fill-crimson-500" />
        <text x="216" y="43" className="fill-silver-300" fontSize="12" fontWeight="600">
          Owner
        </text>

        {/* certified technicians */}
        {techs.map((t) => (
          <g key={t.x}>
            <circle cx={t.x} cy="138" r="19" className="fill-ink-800 stroke-silver-500" strokeOpacity="0.7" />
            <Person cx={t.x} cy={138} className="fill-silver-300" />
            <circle cx={t.x + 15} cy="153" r="7.5" className="fill-crimson-500" />
            <path
              d={`M${t.x + 11.5} 153 l2.6 2.6 l4.6 -5`}
              className="fill-none stroke-white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x={t.x - 28}
              y="170"
              width="56"
              height="20"
              rx="10"
              className="fill-ink-900 stroke-silver-500"
              strokeOpacity="0.6"
            />
            <text
              x={t.x}
              y="184"
              textAnchor="middle"
              className="fill-silver-200"
              fontSize="10.5"
              fontWeight="600"
              letterSpacing="0.8"
            >
              {t.cert}
            </text>
          </g>
        ))}

        {/* uncertified: shown, but left out */}
        <circle
          cx="304"
          cy="138"
          r="19"
          className="fill-none stroke-silver-500"
          strokeOpacity="0.6"
          strokeDasharray="3 3"
        />
        <Person cx={304} cy={138} className="fill-silver-500 opacity-40" />
        <circle cx="319" cy="153" r="7.5" className="fill-ink-900 stroke-crimson-500" />
        <path
          d="M316 150 l6 6 M322 150 l-6 6"
          className="stroke-crimson-500"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="262"
          y="170"
          width="84"
          height="20"
          rx="10"
          className="fill-none stroke-silver-500"
          strokeOpacity="0.5"
          strokeDasharray="3 3"
        />
        <text
          x="304"
          y="184"
          textAnchor="middle"
          className="fill-silver-500"
          fontSize="10.5"
          fontWeight="600"
          letterSpacing="0.6"
        >
          Not certified
        </text>

        {/* your systems */}
        <path
          d="M180 217 l22 7 v13 c0 12 -9 20 -22 25 c-13 -5 -22 -13 -22 -25 v-13 z"
          className="fill-crimson-500"
        />
        <path
          d="M170 240 l7 7 l13 -14"
          className="fill-none stroke-white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="214" y="246" className="fill-silver-300" fontSize="12" fontWeight="600">
          Your systems
        </text>
      </svg>
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
