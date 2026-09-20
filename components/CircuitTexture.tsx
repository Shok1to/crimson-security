import PixelField from './PixelField';

/**
 * Circuit traces ending in round terminals, dissolving into pixels — the shield motif
 * from the logo, used as a low-contrast background texture.
 */
const TRACES: { d: string; dot: [number, number] }[] = [
  { d: 'M0 70 H170 L200 100 H400', dot: [400, 100] },
  { d: 'M0 150 H80 L110 180 H290', dot: [290, 180] },
  { d: 'M0 240 H230 L260 210 H500', dot: [500, 210] },
  { d: 'M0 330 H130 L160 360 H360', dot: [360, 360] },
  { d: 'M0 420 H290 L320 390 H460', dot: [460, 390] },
];

interface CircuitTextureProps {
  /** Which edge the traces enter from. */
  side?: 'left' | 'right';
  /** Callers must position vertically (e.g. `inset-y-0`, or `top-24 h-[640px]`). */
  className?: string;
  /** Pixel-dissolve cluster. Only enable where no text sits beneath it (e.g. the centred hero). */
  pixels?: boolean;
}

export default function CircuitTexture({
  side = 'left',
  className = '',
  pixels = false,
}: CircuitTextureProps) {
  const right = side === 'right';
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${right ? 'right-0' : 'left-0'} w-[36%] min-w-[160px] max-w-[560px] ${className}`}
      style={{
        maskImage: `linear-gradient(to ${right ? 'left' : 'right'}, #000 0%, #000 45%, transparent 100%)`,
        WebkitMaskImage: `linear-gradient(to ${right ? 'left' : 'right'}, #000 0%, #000 45%, transparent 100%)`,
      }}
    >
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMinYMid slice"
        className={`h-full w-full ${right ? '-scale-x-100' : ''}`}
        focusable="false"
      >
        {TRACES.map((t, i) => (
          <g key={i}>
            <path
              d={t.d}
              fill="none"
              strokeWidth="1.5"
              style={{ stroke: 'rgb(var(--silver-300))', strokeOpacity: 'var(--trace-o)' }}
            />
            <circle
              cx={t.dot[0]}
              cy={t.dot[1]}
              r="4.5"
              fill="#e3220f"
              style={{ fillOpacity: 'var(--dot-o)' }}
            />
          </g>
        ))}
      </svg>
      {pixels && (
        <PixelField
          className={`absolute top-1/2 hidden h-[46%] -translate-y-1/2 lg:block ${right ? 'right-[58%] -scale-x-100' : 'left-[58%]'}`}
          seed={right ? 5 : 11}
        />
      )}
    </div>
  );
}
