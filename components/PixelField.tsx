/**
 * Pixel dissolve — the motif that breaks off the shield's "C" in the logo.
 * Deterministic (seeded) so server and client render identical markup.
 */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PixelFieldProps {
  cols?: number;
  rows?: number;
  cell?: number;
  seed?: number;
  /** Density falls off left → right by default; flip to fall off right → left. */
  flip?: boolean;
  className?: string;
}

export default function PixelField({
  cols = 26,
  rows = 16,
  cell = 14,
  seed = 11,
  flip = false,
  className,
}: PixelFieldProps) {
  const rand = mulberry32(seed);
  const rects: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = c / cols;
      const density = (1 - t) * (1 - t);
      if (rand() > density * 0.7) continue;
      const size = [5, 7, 9][Math.floor(rand() * 3)];
      const x = (flip ? cols - 1 - c : c) * cell + (cell - size) / 2;
      const y = r * cell + (cell - size) / 2;
      const opacity = 0.1 + rand() * 0.55 * (0.4 + density);
      const crimson = rand() < 0.14;
      const twinkle = rand() < 0.07;
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width={size}
          height={size}
          fill={crimson ? '#e3220f' : '#e7e6e6'}
          opacity={opacity}
          className={twinkle ? 'animate-pixel' : undefined}
          style={twinkle ? { animationDelay: `${(rand() * 3).toFixed(2)}s` } : undefined}
        />,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {rects}
    </svg>
  );
}
