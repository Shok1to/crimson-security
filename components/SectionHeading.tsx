import MapleLeaf from './MapleLeaf';
import Reveal from './Reveal';

interface SectionHeadingProps {
  label: string;
  title: React.ReactNode;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading({
  label,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div className={`${centered ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      <Reveal>
        <span className="section-label">
          <MapleLeaf className="h-3.5 w-3.5 text-crimson-400" />
          {label}
        </span>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-silver-50 sm:text-4xl lg:text-5xl text-balance">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.12}>
          <p className="mt-5 text-base leading-relaxed text-silver-300 sm:text-lg">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
