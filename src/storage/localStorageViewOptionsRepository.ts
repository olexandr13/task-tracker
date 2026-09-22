import { createLocalStorageSetting } from './localStorageSetting'
import { DEFAULT_VIEW_OPTIONS, type ViewOptionsRepository } from './viewOptionsRepository'
import { readViewOptions, toStoredViewOptions } from './viewOptionsSchema'

/** The view options, in this browser's `localStorage` (STORE-30). */
export const localStorageViewOptionsRepository: ViewOptionsRepository = createLocalStorageSetting({
  key: 'task-tracker/view-options',
  read: readViewOptions,
  write: toStoredViewOptions,
  fallback: DEFAULT_VIEW_OPTIONS,
})
