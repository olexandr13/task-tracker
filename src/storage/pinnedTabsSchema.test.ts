import { describe, expect, it } from 'vitest'
import { PINNED_TABS_SCHEMA_VERSION, readPinnedTabsState, toStoredPinnedTabsState } from './pinnedTabsSchema'

/* Reading the pinned tabs back (STORE-59 in wiki/storage.md). */

describe('readPinnedTabsState', () => {
  it('reads back what was saved, in its order', () => {
    const state = { pinned: ['#/habits', '#/today', '#/tag/deep%20work'] }

    expect(readPinnedTabsState(toStoredPinnedTabsState(state))).toEqual(state)
    expect(readPinnedTabsState(toStoredPinnedTabsState({ pinned: [] }))).toEqual({ pinned: [] })
  })

  it('does not trust a version it does not know', () => {
    expect(readPinnedTabsState({ version: PINNED_TABS_SCHEMA_VERSION + 1, pinned: ['#/today'] })).toBeNull()
  })

  it('does not trust tabs that are not shaped as they should be', () => {
    expect(readPinnedTabsState(null)).toBeNull()
    expect(readPinnedTabsState(['#/today'])).toBeNull()
    expect(readPinnedTabsState({ version: PINNED_TABS_SCHEMA_VERSION })).toBeNull()
    expect(readPinnedTabsState({ version: PINNED_TABS_SCHEMA_VERSION, pinned: '#/today' })).toBeNull()
    expect(readPinnedTabsState({ version: PINNED_TABS_SCHEMA_VERSION, pinned: ['#/today', 3] })).toBeNull()
  })
})
