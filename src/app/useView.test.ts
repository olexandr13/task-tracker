// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useView } from './useView'
import { oneListView, tagView, viewFromHash, viewHash } from './view'

/* The view kept in the address. LIST ids refer to wiki/views.md, LST ids to wiki/lists.md,
   UI ids to wiki/interface.md. */

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

/** jsdom fires `hashchange` asynchronously, as a browser does. */
async function hashSettles() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
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
      'more',
      'modes',
      'modes/procrastination',
      'modes/warm-up',
      'trash',
      'settings',
    ] as const
    for (const view of views) {
      expect(viewFromHash(viewHash(view))).toBe(view)
    }
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
    await hashSettles()
    expect(result.current[0]).toBe('habits')
    expect(window.location.hash).toBe('#/habits')
  })

  it('follows the address when it changes from outside, as with back (UI-37)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { window.location.hash = '#/trash' })
    await hashSettles()
    expect(result.current[0]).toBe('trash')
  })
})
