import { isRecord } from './plainData'
import type { Theme } from './themeRepository'

/**
 * The saved shape of the theme. Its own version, apart from everything else's.
 * Bump this whenever the shape below changes — and the script in `index.html`
 * that reads it before the page is drawn with it.
 */
export const THEME_SCHEMA_VERSION = 1

export interface StoredTheme {
  version: number
  theme: 'light' | 'dark'
}

/** What to save: nothing when the app follows the system, as it does unset. */
export function toStoredTheme(theme: Theme): StoredTheme | null {
  return theme === 'system' ? null : { version: THEME_SCHEMA_VERSION, theme }
}

/**
 * A saved theme in today's shape, or null when it cannot be trusted — an
 * unknown version, or anything that is not a theme.
 */
export function readTheme(data: unknown): Theme | null {
  if (!isRecord(data) || data.version !== THEME_SCHEMA_VERSION) return null
  return data.theme === 'light' || data.theme === 'dark' ? data.theme : null
}
