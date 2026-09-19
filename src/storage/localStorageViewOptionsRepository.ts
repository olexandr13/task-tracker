import { DEFAULT_VIEW_OPTIONS, type ViewOptions, type ViewOptionsRepository } from './viewOptionsRepository'
import { readViewOptions, toStoredViewOptions } from './viewOptionsSchema'

const STORAGE_KEY = 'task-tracker/view-options'

/**
 * The view options, in this browser's `localStorage`. Options that cannot be read
 * are worth nothing — they are set again with one click — so anything unexpected
 * falls back to the defaults. A browser that refuses storage altogether, as some
 * private windows do, keeps the options for as long as the page is open.
 */
export const localStorageViewOptionsRepository: ViewOptionsRepository = {
  load(): ViewOptions {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) return DEFAULT_VIEW_OPTIONS

      return readViewOptions(JSON.parse(raw)) ?? DEFAULT_VIEW_OPTIONS
    } catch {
      return DEFAULT_VIEW_OPTIONS
    }
  },

  save(options: ViewOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredViewOptions(options)))
    } catch {
      // Kept on screen for this visit only; there is nothing more to do about it.
    }
  },
}
