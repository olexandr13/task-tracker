import { DEFAULT_SIDE_NAV_STATE, type SideNavRepository, type SideNavState } from './sideNavRepository'
import { readSideNavState, toStoredSideNavState } from './sideNavSchema'

const STORAGE_KEY = 'task-tracker/side-nav'

/**
 * The sidebar's layout, in this browser's `localStorage`. A layout that cannot
 * be read is worth nothing — it is set again with one click — so anything
 * unexpected falls back to the default. A browser that refuses storage
 * altogether keeps the layout for as long as the page is open.
 */
export const localStorageSideNavRepository: SideNavRepository = {
  load(): SideNavState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) return DEFAULT_SIDE_NAV_STATE

      return readSideNavState(JSON.parse(raw)) ?? DEFAULT_SIDE_NAV_STATE
    } catch {
      return DEFAULT_SIDE_NAV_STATE
    }
  },

  save(state: SideNavState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredSideNavState(state)))
    } catch {
      // Kept on screen for this visit only; there is nothing more to do about it.
    }
  },
}
