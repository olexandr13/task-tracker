import { createLocalStorageSetting } from './localStorageSetting'
import { DEFAULT_THEME, type ThemeRepository } from './themeRepository'
import { readTheme, toStoredTheme } from './themeSchema'

/**
 * The theme, in this browser's `localStorage` (STORE-40). `index.html` reads the
 * same key before the page is drawn; the two are tested together.
 */
export const localStorageThemeRepository: ThemeRepository = createLocalStorageSetting({
  key: 'task-tracker/theme',
  read: readTheme,
  write: toStoredTheme,
  fallback: DEFAULT_THEME,
})
