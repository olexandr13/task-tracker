import { createLocalStorageSetting } from './localStorageSetting'
import { DEFAULT_SIDE_NAV_STATE, type SideNavRepository } from './sideNavRepository'
import { readSideNavState, toStoredSideNavState } from './sideNavSchema'

/** The sidebar's layout, in this browser's `localStorage` (STORE-31). */
export const localStorageSideNavRepository: SideNavRepository = createLocalStorageSetting({
  key: 'task-tracker/side-nav',
  read: readSideNavState,
  write: toStoredSideNavState,
  fallback: DEFAULT_SIDE_NAV_STATE,
})
