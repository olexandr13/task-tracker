/**
 * How the sidebar is laid out: which of its groups are folded away. A new
 * setting goes here, with its default below and a bump of
 * `SIDE_NAV_SCHEMA_VERSION`.
 */
export interface SideNavState {
  /** Every list is shown, indented under Lists. */
  readonly listsOpen: boolean
}

/** How the sidebar is laid out until the owner folds anything away. */
export const DEFAULT_SIDE_NAV_STATE: SideNavState = { listsOpen: true }

/**
 * Where the sidebar's layout is kept between visits.
 *
 * It belongs to the device rather than the account, as the View options do:
 * how much of the sidebar a screen has room for is the screen's business. Kept
 * in the browser, it is there the moment the app opens, so the sidebar never
 * folds or unfolds once it is drawn.
 */
export interface SideNavRepository {
  load(): SideNavState
  save(state: SideNavState): void
}
