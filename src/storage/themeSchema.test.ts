import { describe, expect, it } from 'vitest'
import { readTheme, THEME_SCHEMA_VERSION, toStoredTheme } from './themeSchema'

/* Reading the theme back (STORE-40 in wiki/storage.md). */

describe('readTheme', () => {
  it('reads back what was saved', () => {
    expect(readTheme(toStoredTheme('light'))).toBe('light')
    expect(readTheme(toStoredTheme('dark'))).toBe('dark')
  })

  it('saves nothing for following the system, which is where it starts', () => {
    expect(toStoredTheme('system')).toBeNull()
  })

  it('does not trust a version it does not know', () => {
    expect(readTheme({ version: THEME_SCHEMA_VERSION + 1, theme: 'light' })).toBeNull()
  })

  it('does not trust anything that is not a theme', () => {
    expect(readTheme(null)).toBeNull()
    expect(readTheme('light')).toBeNull()
    expect(readTheme({ version: THEME_SCHEMA_VERSION })).toBeNull()
    expect(readTheme({ version: THEME_SCHEMA_VERSION, theme: 'system' })).toBeNull()
    expect(readTheme({ version: THEME_SCHEMA_VERSION, theme: 'sepia' })).toBeNull()
  })
})
