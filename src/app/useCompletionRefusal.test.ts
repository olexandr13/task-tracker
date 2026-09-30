// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCompletionRefusal } from './useCompletionRefusal'

/* CHK ids refer to wiki/checklists.md. */

afterEach(() => { vi.useRealTimers() })

describe('a tick the checklist turned down (CHK-11)', () => {
  it('says nothing until a tick is actually refused', () => {
    const { result } = renderHook(() => useCompletionRefusal())

    expect(result.current.refused).toBe(false)
  })

  it('shows the refusal, then lets the row settle back to itself', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCompletionRefusal())

    act(() => { result.current.refuse() })
    expect(result.current.refused).toBe(true)

    act(() => { vi.advanceTimersByTime(3999) })
    expect(result.current.refused).toBe(true)

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current.refused).toBe(false)
  })

  it('renews the note on a second refusal rather than letting the first run out', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCompletionRefusal())

    act(() => { result.current.refuse() })
    act(() => { vi.advanceTimersByTime(3000) })
    act(() => { result.current.refuse() })

    // The first window would have closed by now; the second one is what counts.
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.refused).toBe(true)

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.refused).toBe(false)
  })

  it('takes its timer with it when the row leaves the screen', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useCompletionRefusal())

    act(() => { result.current.refuse() })
    unmount()

    // Nothing is left to fire at a hook that is gone, which would warn if it did.
    expect(vi.getTimerCount()).toBe(0)
  })
})
