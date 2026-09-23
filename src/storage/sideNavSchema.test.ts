import { describe, expect, it } from 'vitest'
import { readSideNavState, SIDE_NAV_SCHEMA_VERSION, toStoredSideNavState } from './sideNavSchema'

/* Reading the sidebar's saved layout back (STORE-31 in wiki/storage.md). */

describe('readSideNavState', () => {
  it('reads back what was saved', () => {
    const folded = { listsOpen: false, rewardsOpen: false }
    const open = { listsOpen: true, rewardsOpen: true }

    expect(readSideNavState(toStoredSideNavState(folded))).toEqual(folded)
    expect(readSideNavState(toStoredSideNavState(open))).toEqual(open)
  })

  it('reads a layout saved before there were pages under Rewards as leaving them open (STORE-31)', () => {
    expect(readSideNavState({ version: 1, state: { listsOpen: false } })).toEqual({
      listsOpen: false,
      rewardsOpen: true,
    })
  })

  it('does not trust a version it does not know', () => {
    expect(readSideNavState({ version: SIDE_NAV_SCHEMA_VERSION + 1, state: { listsOpen: false } })).toBeNull()
  })

  it('does not trust a layout that is not shaped as it should be', () => {
    expect(readSideNavState(null)).toBeNull()
    expect(readSideNavState('closed')).toBeNull()
    expect(readSideNavState({ version: SIDE_NAV_SCHEMA_VERSION })).toBeNull()
    expect(readSideNavState({ version: SIDE_NAV_SCHEMA_VERSION, state: [] })).toBeNull()
    expect(readSideNavState({ version: SIDE_NAV_SCHEMA_VERSION, state: { listsOpen: 'no' } })).toBeNull()
    expect(readSideNavState({ version: SIDE_NAV_SCHEMA_VERSION, state: { listsOpen: true } })).toBeNull()
  })
})
