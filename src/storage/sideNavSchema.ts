import { DEFAULT_SIDE_NAV_STATE, type SideNavState } from './sideNavRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the sidebar's layout. Its own version, apart from
 * everything else's: how the sidebar folds has no reason to change shape with
 * any of it. Bump this whenever the shape below changes, and upgrade on reading.
 *
 * Version 1 folded the lists alone, before there were pages under Rewards
 * (RWD-30), version 2 before the modes were listed under Modes (MODE-7), and
 * version 3 before Tags, the notes and Modes were gathered under Organize
 * (UI-81), and version 4 before Balance, the activity log and the journal were
 * gathered under Reflect (UI-83): one saved then is read as leaving what it
 * never knew open, which is how each starts.
 */
export const SIDE_NAV_SCHEMA_VERSION = 5

export interface StoredSideNavState {
  version: number
  state: SideNavState
}

export function toStoredSideNavState(state: SideNavState): StoredSideNavState {
  return { version: SIDE_NAV_SCHEMA_VERSION, state }
}

/**
 * A saved layout in today's shape, upgraded from the one before it, or null
 * when it can't be trusted — an unknown version, or anything in it that is not
 * what it should be.
 */
export function readSideNavState(data: unknown): SideNavState | null {
  if (!isRecord(data) || !isRecord(data.state)) return null
  const known = [SIDE_NAV_SCHEMA_VERSION, 4, 3, 2, 1]
  if (!known.some((version) => data.version === version)) return null

  const { listsOpen, rewardsOpen, modesOpen, organizeOpen, reflectOpen } = data.state
  if (typeof listsOpen !== 'boolean') return null
  // An older version knew nothing of the pages added since; those start open,
  // as they do for a sidebar never folded at all.
  if (data.version === 1) return { ...DEFAULT_SIDE_NAV_STATE, listsOpen }
  if (typeof rewardsOpen !== 'boolean') return null
  if (data.version === 2) return { ...DEFAULT_SIDE_NAV_STATE, listsOpen, rewardsOpen }
  if (typeof modesOpen !== 'boolean') return null
  if (data.version === 3) return { ...DEFAULT_SIDE_NAV_STATE, listsOpen, rewardsOpen, modesOpen }
  if (typeof organizeOpen !== 'boolean') return null
  if (data.version === 4) return { ...DEFAULT_SIDE_NAV_STATE, listsOpen, rewardsOpen, modesOpen, organizeOpen }
  if (typeof reflectOpen !== 'boolean') return null

  return { listsOpen, rewardsOpen, modesOpen, organizeOpen, reflectOpen }
}
