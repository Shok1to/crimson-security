import MapleLeaf from './MapleLeaf';

/** Line — maple leaf — line. Mirrors the divider beneath the wordmark in the logo. */
export default function LeafDivider({
  className = '',
  tone = 'crimson',
}: {
  className?: string;
  /** `light` for use on the crimson band. */
  tone?: 'crimson' | 'light';
}) {
  const light = tone === 'light';
  return (
    <div className={`flex items-center gap-4 ${className}`} role="presentation" aria-hidden="true">
      <span
        className={`h-px flex-1 bg-gradient-to-r from-transparent ${light ? 'to-white/60' : 'to-crimson-700'}`}
      />
      <MapleLeaf className={`h-4 w-4 ${light ? 'text-white' : 'text-crimson-400'}`} />
      <span
        className={`h-px flex-1 bg-gradient-to-l from-transparent ${light ? 'to-white/60' : 'to-crimson-700'}`}
      />
    </div>
  );
}
