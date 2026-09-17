// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useView } from './useView'
import { viewFromHash, viewHash } from './view'

/* The view kept in the address. LIST and UI ids refer to wiki/lists.md and wiki/interface.md. */

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
    for (const view of ['today', 'week', 'month', 'tasks', 'habits', 'trash', 'settings'] as const) {
      expect(viewFromHash(viewHash(view))).toBe(view)
    }
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
