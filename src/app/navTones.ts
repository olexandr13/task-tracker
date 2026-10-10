/**
 * How an entry in the navigation reads, wherever it is drawn on a wide screen —
 * the sidebar (UI-30) and the pinned tabs (UI-75) — so the page marked looks
 * the same in both.
 */

/** The page you are on (UI-8). */
export const navItemOn = 'bg-neutral-200/70 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'

/** Every other page: quiet until pointed at. */
export const navItemOff =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'
