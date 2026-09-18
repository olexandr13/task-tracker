/**
 * The buttons inside panels that open in place — the date, repeat, tag and reward
 * pickers, a task's menu, the tags offered while typing `#` — so they share one
 * compact size and change together. A panel is a quick aside, not a
 * form: its buttons stay smaller than the screen's own.
 */

/** One line to choose, as every panel lists them. Tone is added by the caller. */
export const panelItem = 'flex w-full min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm'

/** An item that answers the pointer by itself. */
export const panelOption = `${panelItem} transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800`

/** The item already chosen. */
export const panelOptionOn = 'font-medium text-blue-600 dark:text-blue-400'

export const panelOptionOff = 'text-neutral-700 dark:text-neutral-200'

/** A small square button beside a field, such as a stepper's − and +. */
export const panelStep =
  'grid size-6 shrink-0 place-items-center rounded-lg text-base leading-none text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
