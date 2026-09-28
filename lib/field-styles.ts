/**
 * Shared between the contact form and the chat widget so the two inputs cannot
 * drift apart. These resolve against the theme variables in app/globals.css —
 * they render dark at :root and light inside a .theme-light section.
 */
export const inputClass =
  'w-full rounded-lg border border-edge/15 bg-ink-800 px-4 py-3 text-base text-silver-50 placeholder:text-silver-600 transition-colors focus-visible:border-crimson-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-300/40 aria-[invalid=true]:border-crimson-300';

export const labelClass = 'mb-2 block font-display text-sm font-medium text-silver-200';
