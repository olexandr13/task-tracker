import { createLocalStorageSetting } from './localStorageSetting'
import { DEFAULT_PINNED_TABS_STATE, type PinnedTabsRepository } from './pinnedTabsRepository'
import { readPinnedTabsState, toStoredPinnedTabsState } from './pinnedTabsSchema'

/** The pinned tabs, in this browser's `localStorage` (STORE-59). */
export const localStoragePinnedTabsRepository: PinnedTabsRepository = createLocalStorageSetting({
  key: 'task-tracker/pinned-tabs',
  read: readPinnedTabsState,
  write: toStoredPinnedTabsState,
  fallback: DEFAULT_PINNED_TABS_STATE,
})
