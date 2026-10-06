import { describe, expect, it } from 'vitest'
import { isSettingsFoldOpen } from './settingsLayoutRepository'
import { readSettingsLayout, SETTINGS_LAYOUT_SCHEMA_VERSION, toStoredSettingsLayout } from './settingsLayoutSchema'

/* Reading Settings' saved layout back (STORE-57 in wiki/storage.md, UI-35 in wiki/interface.md). */

describe('readSettingsLayout', () => {
  it('reads back what was saved', () => {
    const layout = { account: false, cases: true }

    expect(readSettingsLayout(toStoredSettingsLayout(layout))).toEqual(layout)
    expect(readSettingsLayout(toStoredSettingsLayout({}))).toEqual({})
  })

  it('reads past a part Settings no longer has', () => {
    const saved = { version: SETTINGS_LAYOUT_SCHEMA_VERSION, open: { features: false, gone: true } }

    expect(readSettingsLayout(saved)).toEqual({ features: false })
  })

  it('does not trust a version it does not know', () => {
    expect(readSettingsLayout({ version: SETTINGS_LAYOUT_SCHEMA_VERSION + 1, open: {} })).toBeNull()
  })

  it('does not trust a layout that is not shaped as it should be', () => {
    expect(readSettingsLayout(null)).toBeNull()
    expect(readSettingsLayout({ version: SETTINGS_LAYOUT_SCHEMA_VERSION })).toBeNull()
    expect(readSettingsLayout({ version: SETTINGS_LAYOUT_SCHEMA_VERSION, open: { account: 'no' } })).toBeNull()
  })
})

describe('isSettingsFoldOpen (UI-35)', () => {
  it('opens the sections and folds a feature’s own settings until told otherwise', () => {
    expect(isSettingsFoldOpen({}, 'account')).toBe(true)
    expect(isSettingsFoldOpen({}, 'features')).toBe(true)
    expect(isSettingsFoldOpen({}, 'appearance')).toBe(true)
    expect(isSettingsFoldOpen({}, 'habits')).toBe(false)
    expect(isSettingsFoldOpen({}, 'cases')).toBe(false)
  })

  it('keeps what the owner chose', () => {
    expect(isSettingsFoldOpen({ features: false, cases: true }, 'features')).toBe(false)
    expect(isSettingsFoldOpen({ features: false, cases: true }, 'cases')).toBe(true)
  })
})
