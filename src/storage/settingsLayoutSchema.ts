import { isRecord } from './plainData'
import { SETTINGS_FOLDS, type SettingsFold, type SettingsLayout } from './settingsLayoutRepository'

/**
 * The saved shape of Settings' layout (STORE-57). Its own version, apart from
 * everything else's. Bump this whenever the shape below changes, and upgrade
 * on reading. A part of Settings added later is not a change of shape: a
 * layout that never mentions it leaves it as it starts.
 */
export const SETTINGS_LAYOUT_SCHEMA_VERSION = 1

export interface StoredSettingsLayout {
  version: number
  open: SettingsLayout
}

export function toStoredSettingsLayout(layout: SettingsLayout): StoredSettingsLayout {
  return { version: SETTINGS_LAYOUT_SCHEMA_VERSION, open: layout }
}

/**
 * A saved layout, or null when it can't be trusted — an unknown version, or a
 * part said to be anything but open or folded. A part Settings no longer has
 * is read past: it folds nothing.
 */
export function readSettingsLayout(data: unknown): SettingsLayout | null {
  if (!isRecord(data) || data.version !== SETTINGS_LAYOUT_SCHEMA_VERSION || !isRecord(data.open)) return null

  const layout: Partial<Record<SettingsFold, boolean>> = {}
  for (const [fold, open] of Object.entries(data.open)) {
    if (!(SETTINGS_FOLDS as readonly string[]).includes(fold)) continue
    if (typeof open !== 'boolean') return null
    layout[fold as SettingsFold] = open
  }
  return layout
}
