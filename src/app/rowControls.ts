/**
 * The tones the small controls share — due date, repeat, checklist, tags,
 * description, deleting — so they read as one set and change together.
 */

/**
 * The shape they share: a short pill holding an icon, and beside it the value
 * spelled out when there is room for it. Whether the button is `w-full` in a
 * slot or sized by its own content is the caller's, since that is about where
 * it sits rather than what it is.
 *
 * On a phone they are a step larger — type, icon and height — so a finger can
 * hit them in the sheet (UI-59); on a wide screen they stay compact with the
 * row (UI-23).
 */
const rowControl =
  'flex h-9 items-center gap-2 rounded-lg text-base leading-none transition-colors [&>svg]:size-5 md:h-6 md:gap-1.5 md:text-sm md:[&>svg]:size-4'

/**
 * An icon on its own, padded to a square. A line of these is read as one group
 * of controls, so they are kept close: the padding is the only space between
 * one icon and the next beyond the gap their slots leave.
 */
export const rowControlIcon = `${rowControl} px-1.5 md:px-1`

/** An icon with words beside it, padded so the words are not against the edge. */
export const rowControlLabel = `${rowControl} px-2.5 md:px-2`

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
 * A timer is running against this task. Stronger than a set control, and a
 * quiet pulse so it stays noticeable while the panel is closed.
 */
export const controlRunning =
  'task-timer-running bg-blue-600/15 text-blue-600 hover:bg-blue-600/20 hover:text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 dark:hover:bg-blue-400/25 dark:hover:text-blue-200'

/**
 * Something set, shown as a mark rather than a control — a phone's resting row,
 * where the tinted icons say what the task carries but do not open anything.
 * Same quiet tint as a set control, without the hover that invites a click.
 */
export const controlMarker = 'text-blue-600/70 dark:text-blue-300/55'

/** A timer running, as a phone mark: the same pulse as the control. */
export const controlMarkerRunning = 'task-timer-running text-blue-600 dark:text-blue-300'

/** A due day already gone, as a mark: the same warning red as an overdue control. */
export const controlMarkerOverdue = 'text-red-600 dark:text-red-400'
/**
 * A control that deletes or removes something, wherever it is: a task, a checklist
 * item, a task in the trash, a tag. Muted at rest like any other, so a list is not
 * lined with red, and red under the pointer, so what a click would do is plain
 * before it is done.
 */
export const deleteControl =
  'text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400'

/**
 * The sheet's Delete (UI-48): a word, not a bare ×, and red at rest (UI-38). The
 * sheet is a phone's, where no pointer hovers over it to give the warning first.
 */
export const deleteAction =
  'text-red-600 transition-colors hover:bg-red-50 active:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 dark:active:bg-red-950/40'

/**
 * One line of a sheet's action rows — the schedule, the list, the time, the tags,
 * urgent, the reward (UI-59). On a phone the control in it fills the line, so the
 * whole line is the target, a thumb's height tall; on a wide screen it stays compact.
 */
export const sheetAction =
  'flex min-h-11 w-full min-w-0 items-center max-md:[&>button]:h-11 max-md:[&>div>button]:h-11'

/**
 * The box that ticks a task off, wherever a task can be ticked off — a row, a
 * habit's card, the head of a phone's sheet — so finishing something looks and
 * feels the same everywhere. It is drawn small on every screen, about the size of
 * the title beside it, so a list stays dense. On a phone it answers a touch well
 * past its edge — a thumb's 44 pixels square — and shrinks a touch while pressed
 * (UI-47).
 */
const completionBox =
  'relative grid size-5 shrink-0 place-items-center rounded-md border-2 text-xs leading-none transition before:absolute before:-inset-3 active:scale-90 md:before:hidden'

export const completionBoxOn = `${completionBox} border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700`

export const completionBoxOff = `${completionBox} border-neutral-300 text-transparent hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-300`

/**
 * Not done yet, but ready to be: the time it asks for is in. Green like a done
 * box and hollow like an open one, so it reads as an invitation to tick it off.
 */
export const completionBoxReady = `${completionBox} border-green-600 text-green-600/60 hover:border-green-700 hover:text-green-700 dark:border-green-500 dark:text-green-500/60 dark:hover:border-green-400 dark:hover:text-green-400`

/** A control's detail that has reached what it was after, such as time spent meeting its goal. */
export const detailReached = 'text-green-700 dark:text-green-500'
