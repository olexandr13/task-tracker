import { DEFAULT_HABIT_VIEW_OPTIONS, type HabitViewOptions, type HabitViewOptionsRepository } from './habitViewOptionsRepository'
import { readHabitViewOptions, toStoredHabitViewOptions } from './habitViewOptionsSchema'

const STORAGE_KEY = 'task-tracker/habit-view-options'

/**
 * The habits view options, in this browser's `localStorage`. Options that
 * cannot be read are worth nothing — they are set again with one click — so
 * anything unexpected falls back to the defaults. A browser that refuses
 * storage altogether, as some private windows do, keeps the options for as
 * long as the page is open.
 */
export const localStorageHabitViewOptionsRepository: HabitViewOptionsRepository = {
  load(): HabitViewOptions {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) return DEFAULT_HABIT_VIEW_OPTIONS

      return readHabitViewOptions(JSON.parse(raw)) ?? DEFAULT_HABIT_VIEW_OPTIONS
    } catch {
      return DEFAULT_HABIT_VIEW_OPTIONS
    }
  },

  save(options: HabitViewOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredHabitViewOptions(options)))
    } catch {
      // Kept on screen for this visit only; there is nothing more to do about it.
    }
  },
}
