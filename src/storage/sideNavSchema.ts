import type { SideNavState } from './sideNavRepository'

/**
 * The saved shape of the sidebar's layout. Its own version, apart from
 * everything else's: how the sidebar folds has no reason to change shape with
 * any of it. Bump this whenever the shape below changes, and upgrade on reading.
 */
export const SIDE_NAV_SCHEMA_VERSION = 1

export interface StoredSideNavState {
  version: number
  state: SideNavState
}

export function toStoredSideNavState(state: SideNavState): StoredSideNavState {
  return { version: SIDE_NAV_SCHEMA_VERSION, state }
}

/**
 * A saved layout in today's shape, or null when it can't be trusted — an
 * unknown version, or anything in it that is not what it should be.
 */
export function readSideNavState(data: unknown): SideNavState | null {
  if (!isRecord(data) || data.version !== SIDE_NAV_SCHEMA_VERSION || !isRecord(data.state)) return null

  const { listsOpen } = data.state
  if (typeof listsOpen !== 'boolean') return null

  return { listsOpen }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
