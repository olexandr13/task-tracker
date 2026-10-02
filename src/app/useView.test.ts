// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useView } from './useView'
import { oneListView, tagView, viewFromHash, viewHash } from './view'

/* The view kept in the address. LIST ids refer to wiki/views.md, LST ids to wiki/lists.md,
   UI ids to wiki/interface.md. */

beforeEach(() => {
  // A fresh entry at the end of jsdom's one history, as a page opened from elsewhere is.
  window.history.pushState(null, '', '/')
})

afterEach(() => {
  cleanup()
})

/** jsdom fires `popstate` asynchronously, as a browser does, and moves through the history in two hops. */
async function historySettles() {
  for (let hop = 0; hop < 3; hop++) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  }
}

/** The browser's back button. */
async function back() {
  act(() => { window.history.back() })
  await historySettles()
}

describe('viewFromHash', () => {
  it('reads back every view it writes', () => {
    const views = [
      'today',
      'week',
      'month',
      'tasks',
      'inbox',
      'habits',
      'rewards',
      'lists',
      'tags',
      'balance',
      'activity',
      'more',
      'modes',
      'modes/procrastination',
      'modes/warm-up',
      'modes/nudge',
      'modes/check-in',
      'trash',
      'settings',
    ] as const
    for (const view of views) {
      expect(viewFromHash(viewHash(view))).toBe(view)
    }
  })

  it('gives the Balance page an address of its own (BAL-1, UI-36)', () => {
    expect(viewHash('balance')).toBe('#/balance')
    expect(viewFromHash('#/balance')).toBe('balance')
  })

  it('gives the activity log and the check-in addresses of their own (ACT-1, MODE-1, UI-36)', () => {
    expect(viewHash('activity')).toBe('#/activity')
    expect(viewFromHash('#/activity')).toBe('activity')
    expect(viewFromHash('#/modes/check-in')).toBe('modes/check-in')
  })

  it('names a mode\'s page after the mode, under Modes (MODE-1, UI-36)', () => {
    expect(viewHash('modes/warm-up')).toBe('#/modes/warm-up')
    expect(viewFromHash('#/modes/procrastination')).toBe('modes/procrastination')
    expect(viewFromHash('#/modes/nothing')).toBeNull()
  })

  it('reads back a tag\'s list, whatever the tag is written in (TAG-13)', () => {
    for (const tag of ['work', 'дім', 'q&a']) {
      expect(viewFromHash(viewHash(tagView(tag)))).toBe(tagView(tag))
    }
    expect(viewHash(tagView('дім'))).toBe('#/tag/%D0%B4%D1%96%D0%BC')
  })

  it('reads back one list\'s view, named by the list\'s id (LST-8)', () => {
    const id = '6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d'

    expect(viewHash(oneListView(id))).toBe(`#/list/${id}`)
    expect(viewFromHash(viewHash(oneListView(id)))).toBe(oneListView(id))
  })

  it('names no view for a list with no id', () => {
    expect(viewFromHash('#/list/')).toBeNull()
    expect(viewFromHash('#/list/%E0%A4%A')).toBeNull()
  })

  it('names no view for a tag no tag can be', () => {
    expect(viewFromHash('#/tag/')).toBeNull()
    expect(viewFromHash('#/tag/two%20words')).toBeNull()
    expect(viewFromHash('#/tag/%E0%A4%A')).toBeNull()
  })

  it('names no view for an empty or unknown hash', () => {
    expect(viewFromHash('')).toBeNull()
    expect(viewFromHash('#/nowhere')).toBeNull()
    expect(viewFromHash('#/constructor')).toBeNull()
  })
})

describe('useView', () => {
  it('opens on Today when the address names no view (LIST-1)', () => {
    const { result } = renderHook(() => useView())
    expect(result.current[0]).toBe('today')
  })

  it('opens on the view the address names, as after a reload (UI-36)', () => {
    window.history.replaceState(null, '', '/#/month')
    const { result } = renderHook(() => useView())
    expect(result.current[0]).toBe('month')
  })

  it('puts the view switched to into the address (UI-36)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { result.current[1]('habits') })
    await historySettles()
    expect(result.current[0]).toBe('habits')
    expect(window.location.hash).toBe('#/habits')
  })

  it('follows an address typed in (UI-36)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { window.location.hash = '#/trash' })
    await historySettles()
    expect(result.current[0]).toBe('trash')
  })

  it('goes one level up on back, not to the view before (UI-37)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { result.current[1]('rewards/history') })
    act(() => { result.current[1]('modes/warm-up') })
    await historySettles()

    await back()
    expect(result.current[0]).toBe('modes')
    expect(window.location.hash).toBe('#/modes')

    await back()
    expect(result.current[0]).toBe('more')
    expect(window.location.hash).toBe('#/more')
  })

  it('climbs from a list to Lists and from Lists to Tasks (UI-37, UI-34)', async () => {
    const id = '6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d'
    const { result } = renderHook(() => useView())
    act(() => { result.current[1](oneListView(id)) })
    await historySettles()

    await back()
    expect(result.current[0]).toBe('lists')
    await back()
    expect(result.current[0]).toBe('tasks')
  })

  it('climbs from where a reload or a link lands, too (UI-36, UI-37)', async () => {
    window.history.replaceState(null, '', '/#/rewards/wishlist')
    const { result } = renderHook(() => useView())
    await historySettles()
    expect(result.current[0]).toBe('rewards/wishlist')

    await back()
    expect(result.current[0]).toBe('rewards')
  })

  it('reads the chest’s own address, and climbs to Rewards from it (RWD-30, CHST-22)', async () => {
    window.history.replaceState(null, '', '/#/rewards/chest')
    const { result } = renderHook(() => useView())
    await historySettles()
    expect(result.current[0]).toBe('rewards/chest')

    await back()
    expect(result.current[0]).toBe('rewards')
  })

  it('does not pile the views visited onto the history (UI-37)', async () => {
    const { result } = renderHook(() => useView())
    const before = window.history.length
    act(() => { result.current[1]('habits') })
    act(() => { result.current[1]('today') })
    act(() => { result.current[1]('settings') })
    await historySettles()
    expect(window.history.length).toBe(before)

    act(() => { result.current[1]('tags') })
    act(() => { result.current[1](tagView('work')) })
    act(() => { result.current[1]('modes/procrastination') })
    await historySettles()
    expect(window.history.length).toBe(before + 1)
  })

  it('keeps the address right after leaving a page for a tab (UI-36, UI-37)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { result.current[1]('rewards/rules') })
    await historySettles()
    const before = window.history.length

    act(() => { result.current[1]('habits') })
    expect(result.current[0]).toBe('habits')
    await historySettles()
    expect(window.location.hash).toBe('#/habits')
    expect(window.history.state).toEqual({ level: 'root' })

    // The page rung was dropped, so the next page pushed is the only one above the root.
    act(() => { result.current[1]('tags') })
    await historySettles()
    expect(window.history.length).toBe(before)
  })
})
