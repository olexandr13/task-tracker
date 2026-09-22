import { DEFAULT_HABIT_VIEW_OPTIONS, type HabitViewOptionsRepository } from './habitViewOptionsRepository'
import { readHabitViewOptions, toStoredHabitViewOptions } from './habitViewOptionsSchema'
import { createLocalStorageSetting } from './localStorageSetting'

/** The habits view options, in this browser's `localStorage` (STORE-36). */
export const localStorageHabitViewOptionsRepository: HabitViewOptionsRepository = createLocalStorageSetting({
  key: 'task-tracker/habit-view-options',
  read: readHabitViewOptions,
  write: toStoredHabitViewOptions,
  fallback: DEFAULT_HABIT_VIEW_OPTIONS,
})
