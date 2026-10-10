import { isRecord } from './plainData'
import type { PinnedTabsState } from './pinnedTabsRepository'

/**
 * The saved shape of the pinned tabs (STORE-59). Its own version, apart from
 * everything else's. Bump this whenever the shape below changes, and upgrade
 * on reading.
 */
export const PINNED_TABS_SCHEMA_VERSION = 1

export interface StoredPinnedTabsState {
  version: number
  pinned: readonly string[]
}

export function toStoredPinnedTabsState(state: PinnedTabsState): StoredPinnedTabsState {
  return { version: PINNED_TABS_SCHEMA_VERSION, pinned: state.pinned }
}

/**
 * The saved tabs, or null when they can't be trusted — an unknown version, or
 * anything in the list that is not an address. Whether an address still names
 * a page is the app's to say: one that does not is read past there.
 */
export function readPinnedTabsState(data: unknown): PinnedTabsState | null {
  if (!isRecord(data) || data.version !== PINNED_TABS_SCHEMA_VERSION || !Array.isArray(data.pinned)) return null

  const pinned: unknown[] = data.pinned
  if (!pinned.every((address) => typeof address === 'string')) return null
  return { pinned: pinned as string[] }
}
