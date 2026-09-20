import CircuitTexture from './CircuitTexture';

/**
 * Animated crimson-to-black glow. Only `transform` is animated (compositor-friendly),
 * and gradients are already soft so no blur filters are needed.
 */
export default function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 85% at 50% 0%, #5a0a0d 0%, #33080b 42%, #1d0a0c 100%)',
      }}
    >
      <div
        className="absolute left-1/2 top-[-30%] h-[110vmax] w-[110vmax] -translate-x-1/2 will-change-transform animate-glow-a"
        style={{
          background:
            'radial-gradient(closest-side, rgba(227,34,15,0.34) 0%, rgba(161,0,5,0.2) 38%, rgba(87,0,0,0.08) 62%, transparent 76%)',
        }}
      />
      <div
        className="absolute bottom-[-40%] left-[-20%] h-[90vmax] w-[90vmax] will-change-transform animate-glow-b"
        style={{
          background:
            'radial-gradient(closest-side, rgba(117,0,1,0.42) 0%, rgba(61,0,0,0.2) 50%, transparent 76%)',
        }}
      />
      <div
        className="absolute right-[-25%] top-[10%] h-[70vmax] w-[70vmax] will-change-transform animate-glow-b"
        style={{
          animationDelay: '-8s',
          background:
            'radial-gradient(closest-side, rgba(161,0,5,0.22) 0%, rgba(87,0,0,0.1) 55%, transparent 76%)',
        }}
      />

      {/* Fine grid, faded toward the edges */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#c6c6c5 1px, transparent 1px), linear-gradient(90deg, #c6c6c5 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, #000 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 0%, transparent 70%)',
        }}
      />

      <CircuitTexture side="left" pixels className="inset-y-0 opacity-80" />
      <CircuitTexture side="right" pixels className="inset-y-0 hidden opacity-60 lg:block" />
    </div>
  );
}
