/**
 * The tones the small controls on a row share — due date, repeat, checklist,
 * description — so they read as one set and change together.
 */

/** Nothing set: the control is only a way of setting it. */
export const controlOff =
  'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/**
 * Something set. Tinted enough to tell apart from an empty control, and no more:
 * a list of rows should not read as a column of highlights. Hover brings it up.
 */
export const controlOn =
  'bg-blue-600/5 text-blue-600/70 hover:bg-blue-600/10 hover:text-blue-600 dark:bg-blue-400/5 dark:text-blue-300/55 dark:hover:bg-blue-400/10 dark:hover:text-blue-300/90'

/**
 * The box that ticks a task off, wherever a task can be ticked off — a row, a
 * habit's card — so finishing something looks and feels the same everywhere.
 */
const completionBox =
  'grid size-5 shrink-0 place-items-center rounded-md border-2 text-xs leading-none transition-colors'

export const completionBoxOn = `${completionBox} border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700`

export const completionBoxOff = `${completionBox} border-neutral-300 text-transparent hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-300`
