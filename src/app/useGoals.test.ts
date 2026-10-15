// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendGoal, createGoal, type Goal } from '../core'
import type { GoalChanges, GoalRepository } from '../storage/goalRepository'
import { consoleOutput, expectConsole } from '../test/consoleGuard'
import type { ReportProblem } from './storageProblem'
import { useGoals } from './useGoals'

/*
 * The goals on screen, and what happens when the repository will not play along.
 * GOAL ids refer to wiki/goals.md, STORE ids to wiki/storage.md.
 */

const AT = new Date('2026-10-15T09:00:00.000Z')

afterEach(cleanup)

const GOALS = appendGoal(appendGoal([], createGoal('Get fit', AT)), createGoal('Ship the app', AT))
const [FIT, APP] = GOALS

/** A goal repository the test drives: it hands goals over, or fails, on demand. */
function fakeGoalRepository({ saveFails = false } = {}) {
  let onGoals: (goals: Goal[]) => void = () => {}
  let onError: (error: unknown) => void = () => {}
  const written: GoalChanges[] = []

  const repository: GoalRepository = {
    subscribe(goals, error) {
      onGoals = goals
      onError = error
      return () => {}
    },
    save(changes) {
      written.push(changes)
      return saveFails ? Promise.reject(new Error('insufficient permissions')) : Promise.resolve()
    },
  }

  return {
    repository,
    written,
    arrive: (goals: Goal[]) => { act(() => { onGoals(goals) }) },
    fail: (error: unknown) => { act(() => { onError(error) }) },
  }
}

function setUp(options?: { saveFails?: boolean; onProblem?: ReportProblem }) {
  const goals = fakeGoalRepository(options)
  const { result } = renderHook(() => useGoals(goals.repository, options?.onProblem))
  return { result, ...goals }
}

describe('the goals on screen', () => {
  it('waits for the repository, then shows the goals in the order they are shown (GOAL-16)', () => {
    const { result, arrive } = setUp()
    expect(result.current.isLoading).toBe(true)

    arrive([APP, FIT])

    expect(result.current.isLoading).toBe(false)
    expect(result.current.goals.map((goal) => goal.name)).toEqual(['Get fit', 'Ship the app'])
  })

  it('says so when the goals cannot be loaded or saved (STORE-13)', async () => {
    expectConsole('Could not load goals.', 'Could not save goals.')
    const onProblem = vi.fn()
    const { result, fail } = setUp({ saveFails: true, onProblem })

    fail(new Error('Missing or insufficient permissions.'))
    expect(onProblem).toHaveBeenCalledWith('load')
    expect(result.current.isLoading).toBe(false)

    await act(async () => {
      result.current.add('Get fit')
      await Promise.resolve()
    })
    expect(onProblem).toHaveBeenCalledWith('save')
    expect(consoleOutput()).toHaveLength(2)
  })
})

describe('changing the goals', () => {
  it('hands back the goal it made, so it can be opened at once (GOAL-18)', () => {
    const { result, arrive } = setUp()
    arrive([])

    const made: { goal: Goal | null } = { goal: null }
    act(() => { made.goal = result.current.add('Learn Spanish') })

    expect(made.goal?.name).toBe('Learn Spanish')
  })

  it('makes nothing, and writes nothing, for a name another goal has (GOAL-4)', () => {
    const { result, arrive, written } = setUp()
    arrive(GOALS)

    const made: { goal: Goal | null } = { goal: null }
    act(() => { made.goal = result.current.add('  get FIT ') })

    expect(made.goal).toBeNull()
    expect(written).toEqual([])
  })

  it('renames only the goal asked, and refuses another goal\'s name (GOAL-4, GOAL-5)', () => {
    const { result, arrive, written } = setUp()
    arrive(GOALS)

    const done: { ok: boolean | null } = { ok: null }
    act(() => { done.ok = result.current.rename(FIT.id, 'ship the app') })
    expect(done.ok).toBe(false)
    expect(written).toEqual([])

    act(() => { done.ok = result.current.rename(FIT.id, 'Get strong') })
    expect(done.ok).toBe(true)
    expect(written[0].saved.map((goal) => goal.name)).toEqual(['Get strong'])
  })

  it('removes a deleted goal, and writes that it is gone (GOAL-17)', () => {
    const { result, arrive, written } = setUp()
    arrive(GOALS)

    act(() => { result.current.remove(APP.id) })

    expect(result.current.goals.map((goal) => goal.name)).toEqual(['Get fit'])
    expect(written[0].removed).toEqual([APP.id])
  })

  it('keeps both of two goals made before the screen redraws (STORE-39)', () => {
    const { result, arrive } = setUp()
    arrive([])

    act(() => {
      result.current.add('Get fit')
      result.current.add('Ship the app')
    })

    expect(result.current.goals.map((goal) => goal.name)).toEqual(['Get fit', 'Ship the app'])
  })
})
