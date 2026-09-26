/**
 * The buttons inside panels that open in place — the date, repeat, tag and reward
 * pickers, the tags offered while typing `#` — so they share one size and change
 * together. On a wide screen a panel is a quick aside and stays compact (UI-40).
 * On a phone the same panels sit in the task sheet, so their items grow with the
 * sheet's controls (UI-59), as menus do (UI-49).
 */

/** One line to choose, as every panel lists them. Tone is added by the caller. */
export const panelItem =
  'flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-base md:gap-1.5 md:rounded-lg md:px-2 md:py-1 md:text-sm'

/** The name over a group of items, for the eye; the group carries it for a screen reader. */
export const panelHeading =
  'px-3 pt-1 text-xs font-medium text-neutral-400 md:px-2 md:pt-0.5 md:text-[11px] dark:text-neutral-500'

/** An item that answers the pointer by itself. */
export const panelOption = `${panelItem} transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800`

/** The item already chosen. */
export const panelOptionOn = 'font-medium text-blue-600 dark:text-blue-400'

export const panelOptionOff = 'text-neutral-700 dark:text-neutral-200'

/** A row of icon choices, spread across the panel so its ends line up with the fields under it. */
export const panelIconRow = 'flex justify-between gap-1 px-1 md:gap-0.5'

/** A choice drawn as an icon alone, such as the quick date choices. Tone is added by the caller. */
export const panelIcon =
  'grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-neutral-100 md:size-8 md:rounded-lg dark:hover:bg-neutral-800'

export const panelIconOff =
  'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'

/** The icon already chosen: tinted rather than ticked, there being no room beside it for a mark. */
export const panelIconOn = `${panelOptionOn} bg-blue-600/10`

/** A small square button beside a field, such as a stepper's − and +. */
export const panelStep =
  'grid size-9 shrink-0 place-items-center rounded-xl text-lg leading-none text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 md:size-6 md:rounded-lg md:text-base dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/**
 * Room to leave around a panel brought into view (`usePanelPlacement`): clear of
 * the page's top, and at its foot clear of the bottom bar, the timer's chip and
 * the Plus. Inside a sheet none of those are over it, so its own padding is enough.
 */
export const panelScrollMargin =
  'scroll-mt-3 scroll-mb-[calc(10rem+env(safe-area-inset-bottom))] in-[[aria-modal=true]]:scroll-mb-3 md:scroll-mb-3'

/**
 * One line of a panel that stands for a group of choices of its own — the hour a
 * task is due at, how it repeats — holding the group's name and what it is set to
 * now, and opening it. A whole line is the target, a thumb's height tall.
 */
export const panelRow = `${panelItem} min-h-11 justify-start transition-colors hover:bg-neutral-100 disabled:pointer-events-none md:min-h-8 dark:hover:bg-neutral-800`

/** The head of a group's own view: what it is, and the way back out of it. */
export const panelBack = `${panelItem} min-h-11 font-medium transition-colors hover:bg-neutral-100 md:min-h-8 dark:hover:bg-neutral-800`

/** A small × beside a row, taking away what the row holds without opening it. */
export const panelClear =
  'grid size-11 shrink-0 place-items-center rounded-xl text-base leading-none text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:size-8 md:rounded-lg md:text-sm dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
