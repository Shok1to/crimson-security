import type { ReactNode } from 'react';
import type { ServiceId } from '@/lib/content';
import { mulberry32 } from './PixelField';

/**
 * One bespoke illustration per service, drawn in the logo's vocabulary: silver line-work,
 * crimson accents, circuit traces and the pixel dissolve. Decorative (aria-hidden) — the
 * same facts appear as text in each card. Labels use only names from the service list.
 *
 * Layout contract: the focal artwork is 400×240 and always centred. `wide` cards get an
 * 800×240 canvas with extra decoration either side, so on phones (where the SVG is
 * cropped to the middle) the focal art is still whole.
 *
 * Hover motion (`.svc-anim` in globals.css) only plays while the card is hovered.
 */

const SILVER = '#c6c6c5';
const DIM = '#8a8d93';
const RED = '#e3220f';
const BRIGHT = '#ff4b33';
const DEEP = '#a10005';
const INK = '#1a0e10';
const WELL = '#2a080b';

interface ArtProps {
  wide: boolean;
}

function Canvas({
  wide,
  children,
  extension,
}: {
  wide: boolean;
  children: ReactNode;
  extension?: ReactNode;
}) {
  return (
    <svg
      viewBox={wide ? '0 0 800 240' : '0 0 400 240'}
      preserveAspectRatio={wide ? 'xMidYMid slice' : 'xMidYMid meet'}
      className="absolute inset-0 h-full w-full font-display"
      aria-hidden="true"
      focusable="false"
    >
      {wide && extension}
      <g transform={wide ? 'translate(200 0)' : undefined}>{children}</g>
    </svg>
  );
}

/* ---- shared decoration ------------------------------------------------------ */

/** Pixel dissolve: dense at the origin, thinning out along `dir`. */
function pixels(
  x0: number,
  y0: number,
  cols: number,
  rows: number,
  cell: number,
  seed: number,
  dir: 1 | -1 = 1,
) {
  const rand = mulberry32(seed);
  const out: ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const t = c / cols;
      if (rand() > (1 - t) * (1 - t) * 0.85 + 0.03) continue;
      const size = [4, 6, 8][Math.floor(rand() * 3)];
      out.push(
        <rect
          key={`${c}-${r}`}
          x={x0 + dir * c * cell}
          y={y0 + r * cell}
          width={size}
          height={size}
          fill={rand() < 0.2 ? RED : SILVER}
          opacity={0.14 + rand() * 0.5 * (1 - t)}
        />,
      );
    }
  }
  return out;
}

/** Circuit traces ending in round terminals, entering from the given edge of the wide canvas. */
function Traces({ side }: { side: 'left' | 'right'; seed?: number }) {
  const flip = side === 'right';
  const lines = [
    { d: 'M0 46 H96 L120 70 H176', dot: [176, 70] },
    { d: 'M0 118 H60 L84 142 H150', dot: [150, 142] },
    { d: 'M0 190 H110 L134 166 H186', dot: [186, 166] },
  ];
  return (
    <g transform={flip ? 'translate(800 0) scale(-1 1)' : undefined}>
      {lines.map((l, i) => (
        <g key={i}>
          <path d={l.d} fill="none" stroke={SILVER} strokeOpacity="0.2" strokeWidth="1.4" />
          <circle cx={l.dot[0]} cy={l.dot[1]} r="4" fill={RED} opacity="0.75" />
        </g>
      ))}
    </g>
  );
}

const chip = (x: number, y: number, w: number, label: string, opts: { dim?: boolean } = {}) => (
  <g key={label} opacity={opts.dim ? 0.45 : 1}>
    <rect x={x} y={y} width={w} height="30" rx="15" fill="rgba(255,255,255,0.04)" stroke={SILVER} strokeOpacity="0.55" />
    <circle cx={x + 16} cy={y + 15} r="4" fill={RED} />
    <text x={x + 30} y={y + 19.5} fill={SILVER} fontSize="12" fontWeight="600">
      {label}
    </text>
  </g>
);

/* ---- 1. Compliance Assessments & Reports ------------------------------------ */

export function ComplianceArt({ wide }: ArtProps) {
  const rows = [
    { y: 84, w: 66, done: true },
    { y: 108, w: 52, done: true },
    { y: 132, w: 62, done: true },
    { y: 156, w: 44, done: false },
  ];
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={4} />
          {chip(592, 60, 114, 'FERC / NERC', { dim: true })}
          {chip(592, 104, 114, 'BITS / COBRA', { dim: true })}
          {chip(592, 148, 114, 'GLBA', { dim: true })}
        </>
      }
    >
      {/* report */}
      <rect x="54" y="34" width="126" height="172" rx="12" fill={INK} stroke={DIM} />
      <rect x="70" y="50" width="62" height="8" rx="4" fill={SILVER} opacity="0.75" />
      <rect x="70" y="64" width="36" height="5" rx="2.5" fill={DIM} opacity="0.5" />
      {rows.map((r) => (
        <g key={r.y}>
          <rect x="70" y={r.y - 6} width="12" height="12" rx="3" fill={r.done ? RED : 'none'} stroke={r.done ? RED : DIM} strokeOpacity={r.done ? 1 : 0.7} />
          {r.done && <path d={`M73 ${r.y} l3 3 l5 -6`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="92" y={r.y - 2.5} width={r.w} height="5" rx="2.5" fill={DIM} opacity="0.55" />
        </g>
      ))}
      {/* approval badge */}
      <circle cx="160" cy="192" r="25" fill={DEEP} opacity="0.35" />
      <circle cx="160" cy="192" r="19" fill={RED} />
      <path d="M151 192 l6 6 l12 -13" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* frameworks */}
      {['PCI', 'ISO 27002', 'NIST 800-53', 'HIPAA'].map((label, i) => {
        const y = 48 + i * 42;
        return (
          <g key={label}>
            <path d={`M180 ${y + 15} H214`} stroke={BRIGHT} strokeWidth="1.4" strokeDasharray="3 4" className="svc-anim svc-dash" />
            {chip(214, y, 150, label)}
          </g>
        );
      })}
    </Canvas>
  );
}

/* ---- 2. Penetration Testing ------------------------------------------------- */

export function PentestArt({ wide }: ArtProps) {
  const nodes = [
    [52, 58],
    [66, 176],
    [136, 116],
    [128, 206],
    [118, 34],
  ];
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={9} />
          <Traces side="right" seed={13} />
        </>
      }
    >
      {/* network */}
      <g stroke={SILVER} strokeOpacity="0.4" strokeWidth="1.3" fill="none">
        <path d="M52 58 L136 116" />
        <path d="M66 176 L136 116" />
        <path d="M128 206 L136 116" />
        <path d="M118 34 L136 116" />
        <path d="M52 58 L66 176" strokeDasharray="2 5" />
      </g>
      {/* breach path */}
      <path d="M66 176 L136 116 L246 122" fill="none" stroke={BRIGHT} strokeWidth="2" strokeDasharray="6 7" className="svc-anim svc-dash" />
      {nodes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="8" fill={INK} stroke={SILVER} strokeOpacity="0.8" strokeWidth="1.5" />
      ))}
      {/* target reticle */}
      <circle cx="252" cy="122" r="34" fill="none" stroke={BRIGHT} strokeOpacity="0.55" strokeDasharray="4 6" />
      <circle cx="252" cy="122" r="20" fill={WELL} stroke={BRIGHT} strokeWidth="1.6" />
      <circle cx="252" cy="122" r="8" fill={RED} />
      <g stroke={BRIGHT} strokeWidth="1.6" strokeLinecap="round">
        <path d="M252 72 V90" />
        <path d="M252 154 V172" />
        <path d="M202 122 H220" />
        <path d="M284 122 H302" />
      </g>
      {/* data leaking out */}
      {pixels(304, 96, 8, 6, 11, 21)}
    </Canvas>
  );
}

/* ---- 3. Vulnerability Scanning ---------------------------------------------- */

export function ScanningArt({ wide }: ArtProps) {
  const flagged = new Set([5, 10, 19, 26, 14]);
  const cells = Array.from({ length: 32 }, (_, i) => i);
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={6} />
          <Traces side="right" seed={2} />
        </>
      }
    >
      <defs>
        <linearGradient id="svc-scan-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={RED} stopOpacity="0" />
          <stop offset="1" stopColor={RED} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <text x="62" y="224" fill={DIM} fontSize="11" letterSpacing="2.5">
        INTERNAL
      </text>
      <text x="338" y="224" textAnchor="end" fill={DIM} fontSize="11" letterSpacing="2.5">
        EXTERNAL
      </text>
      {cells.map((i) => {
        const x = 62 + (i % 8) * 36;
        const y = 62 + Math.floor(i / 8) * 36;
        const hit = flagged.has(i);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="24"
            height="24"
            rx="5"
            fill={hit ? RED : 'rgba(255,255,255,0.04)'}
            stroke={hit ? BRIGHT : SILVER}
            strokeOpacity={hit ? 1 : 0.32}
          />
        );
      })}
      {/* scan line: parked mid-grid, sweeps on hover */}
      <g className="svc-anim svc-scan">
        <rect x="150" y="54" width="42" height="152" fill="url(#svc-scan-grad)" />
        <rect x="191" y="54" width="2.5" height="152" fill={BRIGHT} />
      </g>
    </Canvas>
  );
}

/* ---- 4. SSAE 16 / SOC Audits ------------------------------------------------- */

export function SocArt({ wide }: ArtProps) {
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={17} />
          <Traces side="right" seed={8} />
        </>
      }
    >
      {/* partner firms */}
      {[46, 354].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="112" r="17" fill={INK} stroke={SILVER} strokeOpacity="0.6" />
          <rect x={cx - 7} y="104" width="14" height="16" rx="2" fill="none" stroke={SILVER} strokeOpacity="0.8" />
          <path d={`M${cx - 3} 108 h6 M${cx - 3} 112 h6 M${cx - 3} 116 h6`} stroke={SILVER} strokeOpacity="0.6" />
        </g>
      ))}
      <text x="46" y="148" textAnchor="middle" fill={DIM} fontSize="11" letterSpacing="1.5">
        PARTNER
      </text>
      <text x="354" y="148" textAnchor="middle" fill={DIM} fontSize="11" letterSpacing="1.5">
        FIRMS
      </text>
      <path d="M64 112 H104" stroke={BRIGHT} strokeWidth="1.4" strokeDasharray="3 4" className="svc-anim svc-dash" />
      <path d="M296 112 H336" stroke={BRIGHT} strokeWidth="1.4" strokeDasharray="3 4" className="svc-anim svc-dash" />

      {/* certificate */}
      <rect x="104" y="34" width="192" height="156" rx="10" fill={INK} stroke={SILVER} strokeOpacity="0.6" />
      <rect x="113" y="43" width="174" height="138" rx="6" fill="none" stroke={RED} strokeOpacity="0.5" strokeDasharray="4 4" />
      <rect x="152" y="58" width="96" height="9" rx="4.5" fill={SILVER} opacity="0.8" />
      <rect x="132" y="80" width="136" height="5" rx="2.5" fill={DIM} opacity="0.55" />
      <rect x="146" y="94" width="108" height="5" rx="2.5" fill={DIM} opacity="0.4" />
      <path d="M236 152 q7 -14 13 0 t13 0" fill="none" stroke={SILVER} strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
      {/* seal + ribbon */}
      <path d="M170 172 L162 204 L176 196 L188 206 L190 172 Z" fill={DEEP} />
      <circle cx="178" cy="152" r="31" fill="none" stroke={BRIGHT} strokeOpacity="0.5" />
      <circle cx="178" cy="152" r="24" fill={RED} />
      <path d="M168 152 l7 7 l14 -15" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </Canvas>
  );
}

/* ---- 5. Vendor Security Management ------------------------------------------ */

export function VendorArt({ wide }: ArtProps) {
  const vendors = [
    { x: 26, y: 24, score: 5, hub: [122, 70] },
    { x: 278, y: 24, score: 3, hub: [278, 70] },
    { x: 26, y: 172, score: 4, hub: [122, 190] },
    { x: 278, y: 172, score: 2, hub: [278, 190] },
  ];
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={3} />
          <Traces side="right" seed={5} />
        </>
      }
    >
      {vendors.map((v) => (
        <path key={`l-${v.x}-${v.y}`} d={`M200 120 L${v.hub[0]} ${v.hub[1]}`} stroke={v.score <= 2 ? BRIGHT : SILVER} strokeOpacity={v.score <= 2 ? 0.9 : 0.4} strokeWidth="1.4" strokeDasharray={v.score <= 2 ? '5 6' : undefined} className={v.score <= 2 ? 'svc-anim svc-dash' : undefined} />
      ))}
      {vendors.map((v) => (
        <g key={`v-${v.x}-${v.y}`}>
          <rect x={v.x} y={v.y} width="96" height="46" rx="10" fill={INK} stroke={v.score <= 2 ? BRIGHT : SILVER} strokeOpacity={v.score <= 2 ? 0.9 : 0.5} />
          <circle cx={v.x + 18} cy={v.y + 16} r="7" fill="none" stroke={SILVER} strokeOpacity="0.6" />
          <rect x={v.x + 32} y={v.y + 12} width="46" height="5" rx="2.5" fill={DIM} opacity="0.55" />
          {[0, 1, 2, 3, 4].map((d) => (
            <circle key={d} cx={v.x + 16 + d * 15} cy={v.y + 34} r="3.6" fill={d < v.score ? (v.score <= 2 ? BRIGHT : RED) : 'none'} stroke={d < v.score ? 'none' : DIM} strokeOpacity="0.6" />
          ))}
        </g>
      ))}
      {/* hub */}
      <circle cx="200" cy="120" r="42" fill="none" stroke={BRIGHT} strokeOpacity="0.3" strokeDasharray="3 6" />
      <circle cx="200" cy="120" r="30" fill={RED} />
      <path d="M200 102 l14 5 v10 c0 9 -6 15 -14 19 c-8 -4 -14 -10 -14 -19 v-10 z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M194 121 l5 5 l9 -10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Canvas>
  );
}

/* ---- 6. Incident Response --------------------------------------------------- */

export function IrArt({ wide }: ArtProps) {
  const steps = [
    { label: 'Plan', state: 'done' as const, fill: 1 },
    { label: 'Train', state: 'done' as const, fill: 1 },
    { label: 'Test', state: 'done' as const, fill: 1 },
    { label: 'Contain', state: 'active' as const, fill: 0.5 },
    { label: 'Recover', state: 'todo' as const, fill: 0 },
  ];
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={12} />
          <g>
            <line x1="610" y1="120" x2="800" y2="120" stroke={SILVER} strokeOpacity="0.18" />
            {[640, 690, 740].map((x, i) => (
              <circle key={x} cx={x} cy="120" r="4" fill={i === 0 ? RED : 'none'} stroke={i === 0 ? 'none' : SILVER} strokeOpacity="0.4" />
            ))}
            {pixels(610, 40, 8, 4, 11, 31)}
            {pixels(610, 170, 8, 4, 11, 32)}
          </g>
        </>
      }
    >
      <rect x="84" y="24" width="232" height="196" rx="14" fill={INK} stroke={SILVER} strokeOpacity="0.5" />
      <rect x="100" y="40" width="9" height="9" rx="2" fill={RED} />
      <text x="116" y="48.5" fill={DIM} fontSize="10" letterSpacing="2.5">
        RUNBOOK
      </text>
      <line x1="84" y1="62" x2="316" y2="62" stroke={SILVER} strokeOpacity="0.15" />
      {steps.map((s, i) => {
        const y = 88 + i * 26;
        return (
          <g key={s.label}>
            {s.state === 'done' && (
              <>
                <circle cx="112" cy={y} r="10" fill={RED} />
                <path d={`M107 ${y} l4 4 l7 -8`} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {s.state === 'active' && (
              <>
                <circle cx="112" cy={y} r="10" fill="none" stroke={BRIGHT} strokeWidth="2" className="svc-anim svc-pulse" />
                <circle cx="112" cy={y} r="10" fill="none" stroke={BRIGHT} strokeWidth="2" />
                <circle cx="112" cy={y} r="4" fill={BRIGHT} />
              </>
            )}
            {s.state === 'todo' && <circle cx="112" cy={y} r="10" fill="none" stroke={DIM} strokeOpacity="0.7" strokeDasharray="3 3" />}
            <text x="134" y={y + 4.5} fill={s.state === 'todo' ? DIM : s.state === 'active' ? '#fff' : SILVER} fontSize="13" fontWeight={s.state === 'active' ? 700 : 600}>
              {s.label}
            </text>
            <rect x="236" y={y - 3} width="64" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
            {s.fill > 0 && <rect x="236" y={y - 3} width={64 * s.fill} height="6" rx="3" fill={s.state === 'active' ? BRIGHT : RED} />}
          </g>
        );
      })}
    </Canvas>
  );
}

/* ---- 7. Forensic Analysis --------------------------------------------------- */

export function ForensicsArt({ wide }: ArtProps) {
  const ridges = [16, 28, 40, 52, 64, 76];
  const dash = (r: number, i: number) => `${r * (1.6 - i * 0.08)} ${r * 0.45} ${r * 0.9} ${r * 0.35}`;
  const events = [
    { x: 70, hot: false },
    { x: 130, hot: true },
    { x: 196, hot: false },
    { x: 262, hot: true },
    { x: 330, hot: false },
  ];
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          <Traces side="left" seed={22} />
          <Traces side="right" seed={24} />
          <line x1="0" y1="216" x2="240" y2="216" stroke={SILVER} strokeOpacity="0.25" />
          <line x1="560" y1="216" x2="800" y2="216" stroke={SILVER} strokeOpacity="0.25" />
        </>
      }
    >
      {/* fingerprint ridges */}
      <g fill="none" stroke={SILVER} strokeWidth="2.4" strokeLinecap="round" transform="translate(150 112)">
        {ridges.map((r, i) => (
          <circle key={r} r={r} strokeOpacity={0.55 - i * 0.05} strokeDasharray={dash(r, i)} transform={`rotate(${i * 37 - 60})`} />
        ))}
      </g>
      {/* magnifier */}
      <line x1="266" y1="146" x2="304" y2="184" stroke={SILVER} strokeWidth="9" strokeLinecap="round" strokeOpacity="0.85" />
      <circle cx="232" cy="112" r="46" fill="rgba(227,34,15,0.12)" stroke={SILVER} strokeWidth="4" />
      <g fill="none" stroke={BRIGHT} strokeWidth="2.4" strokeLinecap="round" transform="translate(232 112)">
        <circle r="14" strokeDasharray="14 6 24 8" />
        <circle r="28" strokeDasharray="30 10 18 12" transform="rotate(40)" />
      </g>
      <rect x="226" y="106" width="12" height="12" rx="2" fill={RED} />
      {/* evidence timeline */}
      <line x1="40" y1="216" x2="360" y2="216" stroke={SILVER} strokeOpacity="0.25" />
      {events.map((e) => (
        <g key={e.x}>
          <line x1={e.x} y1="210" x2={e.x} y2="222" stroke={e.hot ? BRIGHT : SILVER} strokeOpacity={e.hot ? 1 : 0.4} strokeWidth="1.6" />
          {e.hot && <rect x={e.x - 4} y="205" width="8" height="8" transform={`rotate(45 ${e.x} 209)`} fill={RED} />}
        </g>
      ))}
    </Canvas>
  );
}

/* ---- 8. Security Monitoring / SIEM ------------------------------------------ */

const logRows = [
  [92, 0], [128, 0], [70, 0], [140, 1], [104, 0], [84, 0], [120, 0], [96, 0],
] as const;

export function SiemArt({ wide }: ArtProps) {
  const sources = ['Logs', 'IDS', 'IPS', 'Antivirus'];
  const ys = [40, 84, 128, 172];
  const ticker = (x0: number) =>
    logRows.map(([w, hot], i) => (
      <g key={i}>
        <rect x={x0} y={34 + i * 24} width="10" height="5" rx="2.5" fill={hot ? BRIGHT : DIM} opacity={hot ? 1 : 0.4} />
        <rect x={x0 + 18} y={34 + i * 24} width={w} height="5" rx="2.5" fill={hot ? BRIGHT : SILVER} opacity={hot ? 0.9 : 0.16} />
      </g>
    ));
  return (
    <Canvas
      wide={wide}
      extension={
        <>
          {ticker(28)}
          <g transform="translate(0 0)">{ticker(620)}</g>
        </>
      }
    >
      {sources.map((s, i) => (
        <g key={s}>
          <path d={`M108 ${ys[i] + 14} C140 ${ys[i] + 14}, 140 120, 166 120`} fill="none" stroke={BRIGHT} strokeOpacity="0.8" strokeWidth="1.4" strokeDasharray="4 6" className="svc-anim svc-dash" />
          <rect x="24" y={ys[i]} width="84" height="28" rx="8" fill={INK} stroke={SILVER} strokeOpacity="0.5" />
          <text x="66" y={ys[i] + 18.5} textAnchor="middle" fill={SILVER} fontSize="12" fontWeight="600">
            {s}
          </text>
        </g>
      ))}
      <rect x="166" y="72" width="92" height="96" rx="14" fill={WELL} stroke={RED} strokeWidth="1.6" />
      <text x="212" y="126" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="700" letterSpacing="2">
        SIEM
      </text>
      <path d="M258 120 H288" stroke={BRIGHT} strokeWidth="1.6" />
      <path d="M284 114 l8 6 l-8 6" fill="none" stroke={BRIGHT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="296" y="92" width="86" height="56" rx="10" fill={INK} stroke={SILVER} strokeOpacity="0.6" />
      <text x="339" y="117" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="600">
        Alert
      </text>
      <text x="339" y="133" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="600">
        escalation
      </text>
      <circle cx="380" cy="94" r="6" fill={BRIGHT} />
    </Canvas>
  );
}

export const serviceArt: Record<ServiceId, (props: ArtProps) => JSX.Element> = {
  compliance: ComplianceArt,
  pentest: PentestArt,
  soc: SocArt,
  scanning: ScanningArt,
  vendor: VendorArt,
  ir: IrArt,
  forensics: ForensicsArt,
  siem: SiemArt,
};
