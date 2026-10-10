/**
 * Which pages are pinned as tabs across the top of a wide screen (UI-75), in
 * the order they are drawn. Each is the page's address as it stands after the
 * `#` of the app's own — `#/habits`, `#/list/8f3…`, `#/tag/work` (UI-36) — so a
 * tab is named the way a bookmark is, and the app reads it back the same way.
 */
export interface PinnedTabsState {
  readonly pinned: readonly string[]
}

/** Nothing pinned, as on a device that has never pinned anything. */
export const DEFAULT_PINNED_TABS_STATE: PinnedTabsState = { pinned: [] }

/**
 * Where the pinned tabs are kept between visits (STORE-59).
 *
 * They belong to the device rather than the account, as the sidebar's layout
 * does (STORE-31): a phone has no tabs at all, and how many a screen has room
 * for is the screen's business. Kept in the browser, they are there the moment
 * the app opens, so the strip never fills in once it is drawn.
 */
export interface PinnedTabsRepository {
  load(): PinnedTabsState
  save(state: PinnedTabsState): void
}
