import type { SVGProps } from 'react';

/** Path shared with /public/maple-leaf.svg (used as a CSS mask for list bullets). */
export const MAPLE_LEAF_PATH =
  'M50 2 L58 19 L64 14 L63 36 L77 27 L75 44 L98 40 L91 58 L97 66 L73 72 L76 84 L53.5 76 L52.5 98 L47.5 98 L46.5 76 L24 84 L27 72 L3 66 L9 58 L2 40 L25 44 L23 27 L37 36 L36 14 L42 19 L50 2 Z';

/** Small maple-leaf glyph — mirrors the leaf under the wordmark. Decorative by default. */
export default function MapleLeaf({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d={MAPLE_LEAF_PATH} />
    </svg>
  );
}
