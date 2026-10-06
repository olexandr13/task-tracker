import { createLocalStorageSetting } from './localStorageSetting'
import { DEFAULT_SETTINGS_LAYOUT, type SettingsLayoutRepository } from './settingsLayoutRepository'
import { readSettingsLayout, toStoredSettingsLayout } from './settingsLayoutSchema'

/** Settings' layout, in this browser's `localStorage` (STORE-57). */
export const localStorageSettingsLayoutRepository: SettingsLayoutRepository = createLocalStorageSetting({
  key: 'task-tracker/settings-layout',
  read: readSettingsLayout,
  write: toStoredSettingsLayout,
  fallback: DEFAULT_SETTINGS_LAYOUT,
})
