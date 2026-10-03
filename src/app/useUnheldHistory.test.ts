// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TaskScope } from '../storage/taskRepository'
import { useUnheldHistory } from './useUnheldHistory'

/* Whether a view has done work not loaded yet. STORE ids refer to wiki/storage.md. */

afterEach(cleanup)

const ALL: TaskScope = { kind: 'all' }

/** A count that answers when told to. */
function deferredCount() {
  const pending: ((count: number | null) => void)[] = []
  const unheld = vi.fn((_scope: TaskScope) => new Promise<number | null>((resolve) => { pending.push(resolve) }))
  const answer = async (count: number | null) => {
    await act(async () => { pending.shift()?.(count) })
  }
  return { unheld, answer }
}

describe('useUnheldHistory', () => {
  it('is unknown until the server has counted, then says whether there is any (STORE-55)', async () => {
    const { unheld, answer } = deferredCount()
    const { result } = renderHook(() => useUnheldHistory(ALL, '2026-09-28', true, unheld))

    expect(result.current).toBe('unknown')
    await answer(4)

    expect(result.current).toBe('some')
    expect(unheld).toHaveBeenCalledTimes(1)
  })

  it('asks nothing until the tasks have loaded, nor once every task is held (STORE-55)', () => {
    const { unheld } = deferredCount()
    const { result, rerender } = renderHook(
      ({ heldSince, loaded }: { heldSince: string | null; loaded: boolean }) => useUnheldHistory(ALL, heldSince, loaded, unheld),
      { initialProps: { heldSince: '2026-09-28' as string | null, loaded: false } },
    )

    rerender({ heldSince: null, loaded: true })

    expect(unheld).not.toHaveBeenCalled()
    expect(result.current).toBe('none')
  })

  it('asks again once more is held, keeping the last answer meanwhile (STORE-55)', async () => {
    const { unheld, answer } = deferredCount()
    const { result, rerender } = renderHook(({ heldSince }) => useUnheldHistory(ALL, heldSince, true, unheld), {
      initialProps: { heldSince: '2026-09-28' },
    })
    await answer(4)

    rerender({ heldSince: '2026-09-03' })
    expect(result.current).toBe('some')
    await answer(0)

    expect(unheld).toHaveBeenCalledTimes(2)
    expect(result.current).toBe('none')
  })

  it('stays unknown when the server cannot be asked (STORE-55)', async () => {
    const { unheld, answer } = deferredCount()
    const { result } = renderHook(() => useUnheldHistory(ALL, '2026-09-28', true, unheld))

    await answer(null)

    expect(result.current).toBe('unknown')
  })
})
