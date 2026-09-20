import Image from 'next/image';

/* Supporting visuals for the capability tabs. Decorative — the same information is in
   the tab panel's text — so everything here is aria-hidden. */

/* ---- Assess & Comply: frameworks orbiting the shield ------------------------ */

const frameworks = ['PCI', 'ISO 27002', 'GLBA', 'HIPAA', 'NIST 800-53', 'FERC / NERC', 'BITS / COBRA', 'SOC'];

export function AssessVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[400px]">
      <div className="absolute inset-[14%] rounded-full border border-dashed border-silver-500/40" />
      <div className="absolute inset-[30%] rounded-full border border-edge/10" />
      <div
        className="absolute inset-[34%] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(227,34,15,0.28), transparent)' }}
      />
      <Image
        src="/crimson-security-mark.png"
        alt=""
        width={160}
        height={160}
        sizes="160px"
        className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {frameworks.map((name, i) => {
        const angle = (i / frameworks.length) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 39;
        const top = 50 + Math.sin(angle) * 39;
        return (
          <span
            key={name}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-silver-400/40 bg-ink-800 px-2.5 py-1 font-display text-[0.62rem] font-semibold tracking-wide text-silver-100 sm:text-xs"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}

/* ---- Test & Scan: radar sweep ---------------------------------------------- */

const blips = [
  { x: 68, y: 30, d: 0 },
  { x: 30, y: 38, d: 0.8 },
  { x: 58, y: 66, d: 1.6 },
  { x: 24, y: 62, d: 2.4 },
  { x: 78, y: 54, d: 3.2 },
];

export function TestVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[380px]">
      {['inset-0', 'inset-[17%]', 'inset-[34%]', 'inset-[46%]'].map((c) => (
        <div key={c} className={`absolute ${c} rounded-full border border-silver-500/30`} />
      ))}
      <div className="absolute left-1/2 top-0 h-full w-px bg-edge/10" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-edge/10" />
      <div
        className="absolute inset-0 rounded-full will-change-transform animate-sweep"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(227,34,15,0) 0deg, rgba(227,34,15,0) 285deg, rgba(227,34,15,0.5) 360deg)',
        }}
      />
      {blips.map((b, i) => (
        <span
          key={i}
          className="absolute flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        >
          <span
            className="absolute inset-0 rounded-full bg-crimson-400 animate-ping-soft"
            style={{ animationDelay: `${b.d}s` }}
          />
          <span className="relative h-2 w-2 rounded-full bg-crimson-300" />
        </span>
      ))}
      <span className="absolute left-1/2 top-[3%] -translate-x-1/2 rounded bg-ink-900/80 px-2 font-display text-[0.6rem] uppercase tracking-[0.25em] text-silver-400">
        External
      </span>
      <span className="absolute left-1/2 top-[36%] -translate-x-1/2 rounded bg-ink-900/80 px-2 font-display text-[0.6rem] uppercase tracking-[0.25em] text-silver-400">
        Internal
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-crimson-400/60 bg-ink-800 px-3 py-1 font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-crimson-300">
        Manually verified
      </span>
    </div>
  );
}

/* ---- Monitor & Manage: sources -> SIEM -> escalation, plus vendor chain ----- */

const sources = ['Logs', 'IDS', 'IPS', 'Antivirus'];

export function MonitorVisual() {
  const ys = [30, 84, 138, 192];
  return (
    <svg
      viewBox="0 0 480 340"
      aria-hidden="true"
      focusable="false"
      className="mx-auto h-auto w-full max-w-[460px] font-display"
    >
      <defs>
        <marker id="arrow-m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" className="fill-crimson-400" />
        </marker>
      </defs>

      {sources.map((s, i) => {
        const y = ys[i];
        return (
          <g key={s}>
            <path
              d={`M120 ${y + 17} C155 ${y + 17}, 155 140, 190 140`}
              className="animate-dash-flow fill-none stroke-crimson-400/70"
              strokeWidth="1.5"
              strokeDasharray="4 8"
            />
            <rect x="20" y={y} width="100" height="34" rx="8" className="fill-ink-800 stroke-silver-500/50" />
            <text x="70" y={y + 21.5} textAnchor="middle" className="fill-silver-100" fontSize="12" fontWeight="600">
              {s}
            </text>
          </g>
        );
      })}

      <rect x="190" y="80" width="100" height="120" rx="14" className="fill-crimson-900/60 stroke-crimson-400" strokeWidth="1.5" />
      <text x="240" y="135" textAnchor="middle" className="fill-white" fontSize="20" fontWeight="700" letterSpacing="2">
        SIEM
      </text>
      <text x="240" y="156" textAnchor="middle" className="fill-silver-300" fontSize="10" letterSpacing="1.5">
        MONITORING
      </text>

      <path d="M290 140 H345" className="stroke-crimson-400 fill-none" strokeWidth="1.5" markerEnd="url(#arrow-m)" />
      <rect x="350" y="108" width="110" height="64" rx="10" className="fill-ink-800 stroke-silver-400/60" />
      <text x="405" y="136" textAnchor="middle" className="fill-silver-50" fontSize="12" fontWeight="600">
        Alert
      </text>
      <text x="405" y="154" textAnchor="middle" className="fill-silver-50" fontSize="12" fontWeight="600">
        escalation
      </text>

      <text x="20" y="262" className="fill-silver-500" fontSize="10" letterSpacing="2.5">
        VENDOR SECURITY MANAGEMENT
      </text>
      {['Evaluate', 'Rate', 'Manage remediation'].map((label, i) => {
        const x = [20, 170, 300][i];
        const w = [120, 100, 160][i];
        return (
          <g key={label}>
            <rect x={x} y="274" width={w} height="36" rx="18" className="fill-ink-800 stroke-silver-500/50" />
            <text x={x + w / 2} y="296.5" textAnchor="middle" className="fill-silver-100" fontSize="12" fontWeight="600">
              {label}
            </text>
            {i < 2 && (
              <path
                d={`M${x + w + 4} 292 H${[166, 296][i]}`}
                className="stroke-crimson-400 fill-none"
                strokeWidth="1.5"
                markerEnd="url(#arrow-m)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---- Respond & Recover: IR timeline + forensics ---------------------------- */

const steps = ['Plan', 'Train', 'Test', 'Contain', 'Recover'];

export function RespondVisual() {
  return (
    <svg
      viewBox="0 0 480 340"
      aria-hidden="true"
      focusable="false"
      className="mx-auto h-auto w-full max-w-[460px] font-display"
    >
      {/* phase brackets */}
      <path d="M40 62 V54 H240 V62" className="fill-none stroke-silver-500/60" strokeWidth="1.5" />
      <text x="140" y="42" textAnchor="middle" className="fill-silver-400" fontSize="10" letterSpacing="2.5">
        BEFORE AN INCIDENT
      </text>
      <path d="M340 62 V54 H440 V62" className="fill-none stroke-crimson-400/80" strokeWidth="1.5" />
      <text x="390" y="42" textAnchor="middle" className="fill-crimson-300" fontSize="10" letterSpacing="2.5">
        DURING
      </text>

      {/* timeline */}
      <line x1="40" y1="110" x2="440" y2="110" className="stroke-silver-600" strokeWidth="2" />
      <line
        x1="40"
        y1="110"
        x2="440"
        y2="110"
        className="animate-dash-flow stroke-crimson-400"
        strokeWidth="2"
        strokeDasharray="4 8"
      />
      {steps.map((s, i) => {
        const x = 40 + i * 100;
        const during = i >= 3;
        return (
          <g key={s}>
            <circle cx={x} cy="110" r="11" className={`fill-ink-900 ${during ? 'stroke-crimson-400' : 'stroke-silver-300'}`} strokeWidth="2" />
            <circle cx={x} cy="110" r="4" className={during ? 'fill-crimson-400' : 'fill-silver-300'} />
            <text x={x} y="148" textAnchor="middle" className="fill-silver-100" fontSize="13" fontWeight="600">
              {s}
            </text>
          </g>
        );
      })}

      {/* forensics */}
      <rect
        x="70"
        y="210"
        width="340"
        height="80"
        rx="14"
        className="fill-crimson-900/40 stroke-crimson-400/70"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />
      <text x="240" y="244" textAnchor="middle" className="fill-white" fontSize="17" fontWeight="700">
        Forensic analysis
      </text>
      <text x="240" y="266" textAnchor="middle" className="fill-silver-300" fontSize="11">
        Comprehensive analysis on suspected incidents
      </text>
    </svg>
  );
}
