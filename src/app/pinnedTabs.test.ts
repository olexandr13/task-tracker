import { describe, expect, it } from 'vitest'
import { createList } from '../core'
import { moveTab, pinnedAddresses, pinnedViews, pinTab, tabsShown, unpinTab } from './pinnedTabs'
import { oneListView, tagView, type View } from './view'

/* The tabs pinned across the top of a wide screen: which are drawn, and how
   pinning, unpinning and dragging change them. UI ids refer to wiki/interface.md,
   STORE ids to wiki/storage.md, FEAT ids to wiki/features.md. */

const work = createList('Work', new Date(2026, 9, 9))

describe('pinnedViews', () => {
  it('reads each saved address back as its page, in order (STORE-59)', () => {
    const views: View[] = ['habits', oneListView(work.id), tagView('reading'), 'rewards/history']

    expect(pinnedViews(pinnedAddresses(views))).toEqual(views)
  })

  it('reads past an address naming no page, and a page pinned twice (STORE-59)', () => {
    expect(pinnedViews(['#/today', '#/nowhere', '#/today', '#/habits'])).toEqual(['today', 'habits'])
  })
})

describe('pinTab and unpinTab', () => {
  it('pins at the end, and once (UI-76)', () => {
    expect(pinTab(['today'], 'habits')).toEqual(['today', 'habits'])
    expect(pinTab(['today', 'habits'], 'today')).toEqual(['today', 'habits'])
  })

  it('unpins only the tab asked (UI-76)', () => {
    expect(unpinTab(['today', 'habits', 'rewards'], 'habits')).toEqual(['today', 'rewards'])
    expect(unpinTab(['today'], 'habits')).toEqual(['today'])
  })
})

describe('moveTab', () => {
  const pinned: View[] = ['today', 'habits', 'tasks', 'rewards']

  it('puts a tab carried rightwards after the one it is dropped on (UI-78)', () => {
    expect(moveTab(pinned, 'today', 'tasks')).toEqual(['habits', 'tasks', 'today', 'rewards'])
  })

  it('puts a tab carried leftwards before the one it is dropped on (UI-78)', () => {
    expect(moveTab(pinned, 'rewards', 'habits')).toEqual(['today', 'rewards', 'habits', 'tasks'])
  })

  it('leaves the tabs as they were for a drop on itself or on something unpinned (UI-78)', () => {
    expect(moveTab(pinned, 'tasks', 'tasks')).toEqual(pinned)
    expect(moveTab(pinned, 'tasks', 'settings')).toEqual(pinned)
  })
})

describe('tabsShown', () => {
  const shown = (pinned: View[], view: View, options: { off?: Parameters<typeof tabsShown>[0]['off'] } = {}) =>
    tabsShown({ pinned, view, off: options.off ?? [], lists: [work], tags: ['Reading'] })

  it('draws the pinned tabs, and marks the page open among them (UI-75)', () => {
    expect(shown(['today', 'habits'], 'habits')).toEqual({ tabs: ['today', 'habits'], current: null })
  })

  it('draws the page open after them when it is not pinned, even under a pinned one (UI-75, UI-76)', () => {
    expect(shown(['today', 'rewards'], 'rewards/history')).toEqual({
      tabs: ['today', 'rewards'],
      current: 'rewards/history',
    })
    expect(shown([], 'today')).toEqual({ tabs: [], current: 'today' })
  })

  it('leaves out a tab whose page is switched off, a list that is gone and a tag no task carries (UI-77, FEAT-2)', () => {
    const gone = oneListView('gone')
    const pinned: View[] = ['today', 'habits', oneListView(work.id), gone, tagView('reading'), tagView('old')]

    expect(shown(pinned, 'today', { off: ['habits'] }).tabs).toEqual([
      'today',
      oneListView(work.id),
      tagView('reading'),
    ])
  })

  it('draws the page open as its pinned tab while its list is still arriving (UI-77)', () => {
    const late = oneListView('late')

    expect(shown(['today', late], late)).toEqual({ tabs: ['today', late], current: null })
  })
})
