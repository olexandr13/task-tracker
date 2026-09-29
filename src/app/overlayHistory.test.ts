// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { holdOverlay } from './overlayHistory'
import { useView } from './useView'

/* Back closing a sheet rather than leaving the app (UI-71). UI-37 is the views' ladder. */

beforeEach(() => {
  window.history.pushState(null, '', '/')
})

afterEach(async () => {
  cleanup()
  await settles()
})

/** jsdom fires `popstate` asynchronously, as a browser does. */
async function settles() {
  for (let hop = 0; hop < 3; hop++) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  }
}

async function back() {
  act(() => { window.history.back() })
  await settles()
}

function onOverlay(): boolean {
  const state = window.history.state
  return state !== null && typeof state === 'object' && 'overlay' in state && state.overlay === true
}

describe('holdOverlay', () => {
  it('closes the sheet on back, and leaves the address as it was (UI-71)', async () => {
    window.history.replaceState({ level: 'root' }, '', '/#/today')
    const onClose = vi.fn()
    holdOverlay(onClose)

    expect(onOverlay()).toBe(true)
    expect(window.location.hash).toBe('#/today')

    await back()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onOverlay()).toBe(false)
    expect(window.location.hash).toBe('#/today')
  })

  it('closes a sheet over a sheet first, and the one under it on the next back (UI-64, UI-71)', async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    holdOverlay(outer)
    holdOverlay(inner)

    await back()
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).not.toHaveBeenCalled()
    expect(onOverlay()).toBe(true)

    await back()
    expect(outer).toHaveBeenCalledOnce()
    expect(onOverlay()).toBe(false)
  })

  it('drops the extra history when the sheet is closed from the page, so the next back is not a close (UI-71)', async () => {
    const onClose = vi.fn()
    const release = holdOverlay(onClose)
    expect(onOverlay()).toBe(true)

    release()
    await settles()
    expect(onOverlay()).toBe(false)

    await back()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps the rung when only the sheet on top is closed from the page (UI-64, UI-71)', async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    holdOverlay(outer)
    const releaseInner = holdOverlay(inner)

    releaseInner()
    await settles()
    expect(onOverlay()).toBe(true)
    expect(inner).not.toHaveBeenCalled()

    await back()
    expect(outer).toHaveBeenCalledOnce()
    expect(inner).not.toHaveBeenCalled()
  })
})

describe('back with a sheet over a view', () => {
  it('closes the sheet and stays on the view, then climbs a level (UI-37, UI-71)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { result.current[1]('modes/warm-up') })
    await settles()

    const onClose = vi.fn()
    holdOverlay(onClose)

    await back()
    expect(onClose).toHaveBeenCalledOnce()
    expect(result.current[0]).toBe('modes/warm-up')
    expect(window.location.hash).toBe('#/modes/warm-up')

    await back()
    expect(result.current[0]).toBe('modes')
    expect(window.location.hash).toBe('#/modes')
  })

  it('closes the sheet on a tab and stays there, so the next back can leave (UI-37, UI-71)', async () => {
    const { result } = renderHook(() => useView())
    act(() => { result.current[1]('habits') })
    await settles()

    const onClose = vi.fn()
    holdOverlay(onClose)

    await back()
    expect(onClose).toHaveBeenCalledOnce()
    expect(result.current[0]).toBe('habits')
    expect(window.location.hash).toBe('#/habits')
  })
})
