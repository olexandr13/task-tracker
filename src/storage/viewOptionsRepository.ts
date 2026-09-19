/**
 * How the task views are shown: one set for every view that lists tasks, set
 * from the View button beside the add box. A new option goes here, with its
 * default below and a bump of `VIEW_OPTIONS_SCHEMA_VERSION`.
 */
export interface ViewOptions {
  /** Every row spells out what its controls hold, not only the woken one. */
  readonly showDetails: boolean
}

/** How the views are shown until the owner sets them otherwise. */
export const DEFAULT_VIEW_OPTIONS: ViewOptions = { showDetails: false }

/**
 * Where the view options are kept between visits.
 *
 * They belong to the device rather than the account: a phone and a desktop have
 * different room, so each is set its own way. Kept in the browser, they are there
 * the moment the app opens, so loading is immediate and rows never redraw once
 * the options arrive.
 */
export interface ViewOptionsRepository {
  load(): ViewOptions
  save(options: ViewOptions): void
}
