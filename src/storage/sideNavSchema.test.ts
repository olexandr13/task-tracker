import { describe, expect, it } from 'vitest'
import { readSideNavState, SIDE_NAV_SCHEMA_VERSION, toStoredSideNavState } from './sideNavSchema'

/* Reading the sidebar's saved layout back (STORE-31 in wiki/storage.md). */

describe('readSideNavState', () => {
  it('reads back what was saved', () => {
    expect(readSideNavState(toStoredSideNavState({ listsOpen: false }))).toEqual({ listsOpen: false })
    expect(readSideNavState(toStoredSideNavState({ listsOpen: true }))).toEqual({ listsOpen: true })
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
  })
})
