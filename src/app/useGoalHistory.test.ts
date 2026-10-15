// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TaskScope } from '../storage/taskRepository'
import { useGoalHistory } from './useGoalHistory'

/* How much of each goal's done work is not loaded. GOAL ids refer to wiki/goals.md. */

afterEach(cleanup)

/** A count that answers when told to, in the order it was asked. */
function deferredCount() {
  const pending: ((count: number | null) => void)[] = []
  const unheld = vi.fn((_scope: TaskScope) => new Promise<number | null>((resolve) => { pending.push(resolve) }))
  const answer = async (count: number | null) => {
    await act(async () => { pending.shift()?.(count) })
  }
  return { unheld, answer }
}

describe('useGoalHistory', () => {
  it('asks the server about each goal on screen, and counts what it says (GOAL-9)', async () => {
    const { unheld, answer } = deferredCount()
    const { result } = renderHook(() => useGoalHistory(['fit', 'app'], '2026-09-28', true, unheld))

    expect(result.current.size).toBe(0)
    await answer(3)
    await answer(0)

    expect(unheld.mock.calls.map(([scope]) => scope)).toEqual([
      { kind: 'goal', goalId: 'fit' },
      { kind: 'goal', goalId: 'app' },
    ])
    expect(result.current).toEqual(new Map([['fit', 3], ['app', 0]]))
  })

  it('asks nothing while no goal is on screen, before the tasks load, or once every task is held (GOAL-9)', () => {
    const { unheld } = deferredCount()
    const { result, rerender } = renderHook(
      ({ goals, heldSince, loaded }: { goals: string[] | null; heldSince: string | null; loaded: boolean }) =>
        useGoalHistory(goals, heldSince, loaded, unheld),
      { initialProps: { goals: null as string[] | null, heldSince: '2026-09-28' as string | null, loaded: true } },
    )

    rerender({ goals: ['fit'], heldSince: '2026-09-28', loaded: false })
    rerender({ goals: ['fit'], heldSince: null, loaded: true })

    expect(unheld).not.toHaveBeenCalled()
    expect(result.current.size).toBe(0)
  })

  it('asks again once more is held, keeping the last answer meanwhile (GOAL-9)', async () => {
    const { unheld, answer } = deferredCount()
    const { result, rerender } = renderHook(({ heldSince }) => useGoalHistory(['fit'], heldSince, true, unheld), {
      initialProps: { heldSince: '2026-09-28' },
    })
    await answer(5)

    rerender({ heldSince: '2026-09-03' })
    expect(result.current.get('fit')).toBe(5)
    await answer(2)

    expect(unheld).toHaveBeenCalledTimes(2)
    expect(result.current.get('fit')).toBe(2)
  })

  it('does not ask again about a goal it has an answer for, when another joins it', async () => {
    const { unheld, answer } = deferredCount()
    const { rerender } = renderHook(({ goals }) => useGoalHistory(goals, '2026-09-28', true, unheld), {
      initialProps: { goals: ['fit'] },
    })
    await answer(1)

    rerender({ goals: ['fit', 'app'] })

    expect(unheld).toHaveBeenCalledTimes(2)
    expect(unheld.mock.calls[1]?.[0]).toEqual({ kind: 'goal', goalId: 'app' })
  })
})
