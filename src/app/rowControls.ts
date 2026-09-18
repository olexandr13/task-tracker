/**
 * The tones the small controls share — due date, repeat, checklist, tags,
 * description, deleting — so they read as one set and change together.
 */

/**
 * The shape they share: a short pill holding an icon, and beside it the value
 * spelled out when there is room for it. Whether the button is `w-full` in a
 * slot or sized by its own content is the caller's, since that is about where
 * it sits rather than what it is.
 */
const rowControl = 'flex h-6 items-center gap-1.5 rounded-lg text-sm leading-none transition-colors'

/**
 * An icon on its own, padded to a square. A line of these is read as one group
 * of controls, so they are kept close: the padding is the only space between
 * one icon and the next beyond the gap their slots leave.
 */
export const rowControlIcon = `${rowControl} px-1`

/** An icon with words beside it, padded so the words are not against the edge. */
export const rowControlLabel = `${rowControl} px-2`

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
 * A control that deletes or removes something, wherever it is: a task, a checklist
 * item, a task in the trash, a tag. Muted at rest like any other, so a list is not
 * lined with red, and red under the pointer, so what a click would do is plain
 * before it is done.
 */
export const deleteControl =
  'text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400'

/**
 * The box that ticks a task off, wherever a task can be ticked off — a row, a
 * habit's card — so finishing something looks and feels the same everywhere.
 */
const completionBox =
  'grid size-5 shrink-0 place-items-center rounded-md border-2 text-xs leading-none transition-colors'

export const completionBoxOn = `${completionBox} border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700`

export const completionBoxOff = `${completionBox} border-neutral-300 text-transparent hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-300`
