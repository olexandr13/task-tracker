/**
 * How the habits view is shown: whether each habit starts open. A new
 * setting goes here, with its default below and a bump of
 * `HABIT_VIEW_OPTIONS_SCHEMA_VERSION`.
 */
export interface HabitViewOptions {
  /** Every habit starts open, showing its numbers and days. */
  readonly showDetails: boolean
}

/** How the habits view is shown until the owner changes it. */
export const DEFAULT_HABIT_VIEW_OPTIONS: HabitViewOptions = { showDetails: false }

/**
 * Where the habits view options are kept between visits.
 *
 * They belong to the device rather than the account: a phone and a desktop have
 * different room, so each is set its own way. Kept in the browser, they are
 * there the moment the app opens, so habits are drawn in the chosen state
 * without a second pass.
 */
export interface HabitViewOptionsRepository {
  load(): HabitViewOptions
  save(options: HabitViewOptions): void
}
