// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, setReward, startXp, type Task, type XpProgress } from '../core'
import type { XpAddition, XpRepository } from '../storage/xpRepository'
import { expectConsole } from '../test/consoleGuard'
import { useLevel, useXp } from './useXp'

/* Holding where XP stands. LVL ids refer to wiki/levels.md, STORE ids to wiki/storage.md. */

// Thursday 17 September 2026, nine in the morning.
const NOW = new Date(2026, 8, 17, 9, 0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

/** A repository that hands where XP stands back on every write, as Firestore does. */
function fakeRepository(initial: XpProgress | null = { ...startXp('2026-09-17'), settledThrough: '2026-09-16' }, addFails = false) {
  const added: XpAddition[] = []
  const begun: string[] = []
  let progress = initial
  let listener: ((progress: XpProgress | null) => void) | null = null
  const repository: XpRepository = {
    subscribe(onProgress) {
      listener = onProgress
      onProgress(progress)
      return () => {}
    },
    begin(day) {
      begun.push(day)
      progress ??= startXp(day)
      listener?.(progress)
      return Promise.resolve()
    },
    add(addition) {
      added.push(addition)
      if (addFails) return Promise.reject(new Error('permission denied'))
      if (progress !== null) {
        progress = {
          ...progress,
          xp: progress.xp + addition.xp,
          ...(addition.adds === null ? {} : { addsOn: addition.adds.on, adds: addition.adds.count }),
        }
      }
      listener?.(progress)
      return Promise.resolve()
    },
    settle(count) {
      if (progress === null) return Promise.resolve()
      const settled = count(progress)
      if (settled !== null) progress = { ...progress, xp: progress.xp + settled.xp, settledThrough: settled.settledThrough }
      listener?.(progress)
      return Promise.resolve()
    },
    lift(least) {
      if (progress !== null && progress.xp < least) progress = { ...progress, xp: least }
      listener?.(progress)
      return Promise.resolve()
    },
    importProgress: () => Promise.resolve(),
  }
  return { repository, added, begun, current: () => progress }
}

describe('useXp', () => {
  it('begins XP today the first time it has not begun (LVL-2)', () => {
    const { repository, begun } = fakeRepository(null)
    renderHook(() => useXp(repository))

    expect(begun).toEqual(['2026-09-17'])
  })

  it('adds what a change gave, and counts today’s tasks added toward the day’s ten (LVL-4)', () => {
    const { repository, added } = fakeRepository()
    const { result } = renderHook(() => useXp(repository))

    act(() => { result.current.record({ xp: 3, addedToday: 2 }) })

    expect(added).toEqual([{ xp: 5, adds: { on: '2026-09-17', count: 2 } }])
  })

  it('builds changes made in one go on each other (STORE-39)', () => {
    const { repository, added } = fakeRepository({ ...startXp('2026-09-17'), addsOn: '2026-09-17', adds: 9 })
    const { result } = renderHook(() => useXp(repository))

    act(() => {
      result.current.record({ xp: 0, addedToday: 1 })
      result.current.record({ xp: 0, addedToday: 1 })
    })

    expect(added).toEqual([
      { xp: 1, adds: { on: '2026-09-17', count: 10 } },
      { xp: 0, adds: { on: '2026-09-17', count: 11 } },
    ])
  })

  it('adds what finishing a task gave, and clearing Today with it (LVL-5, LVL-6)', () => {
    const { repository, added } = fakeRepository()
    const { result } = renderHook(() => useXp(repository))
    const task = createTask('call mum', null, NOW)

    act(() => { result.current.recordTasks([task], [completeTask(task, NOW)], NOW) })

    // Finished, 2; and no other task asked anything of Today, the week or the month, so all three are clear: 130.
    expect(added).toEqual([{ xp: 2 + 130, adds: null }])
  })

  it('says so when a write is refused (STORE-13)', async () => {
    expectConsole('error', 'Could not save XP.')
    const onProblem = vi.fn()
    const { repository } = fakeRepository(undefined, true)
    const { result } = renderHook(() => useXp(repository, onProblem))

    await act(async () => {
      result.current.record({ xp: 1, addedToday: 0 })
      await Promise.resolve()
    })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})

describe('useLevel', () => {
  function levelOf(repository: XpRepository, tasks: readonly Task[] | null, points = [{ taskId: 't', day: '2026-09-17', points: 30 }]) {
    return renderHook(() => useLevel(useXp(repository), tasks, points, null))
  }

  it('reads the level off where XP stands and the points earned since it began (LVL-3, LVL-9)', () => {
    const { repository } = fakeRepository({ ...startXp('2026-09-17'), xp: 90 })
    const { result } = levelOf(repository, [])

    expect(result.current).toEqual({ total: 120, level: { level: 1, total: 120, into: 20, step: 110 } })
  })

  it('counts nothing until the tasks have loaded', () => {
    const { repository, current } = fakeRepository(startXp('2026-09-15'))
    levelOf(repository, null)

    expect(current()).toEqual(startXp('2026-09-15'))
  })

  it('counts the days gone by once the tasks are known, and the last day counted (LVL-12, LVL-13)', () => {
    const habit = setReward(createTask('stretch', { kind: 'daily' }, new Date(2026, 8, 14, 9, 0)), 1)
    const { repository, current } = fakeRepository({ ...startXp('2026-09-15'), xp: 40 })
    levelOf(repository, [habit])

    // Tuesday and Wednesday missed, twice 3 each, and nothing at all finished on either.
    expect(current()).toMatchObject({ xp: 40 - 12 - 20, settledThrough: '2026-09-16' })
  })

  it('lets go of XP lost below zero, so what is gained after counts from zero (LVL-17)', () => {
    const { repository, current } = fakeRepository({ ...startXp('2026-09-17'), xp: -50 })
    const { result } = levelOf(repository, [])

    // The 30 points give 30 XP: kept at -30, the total is zero.
    expect(current()).toMatchObject({ xp: -30 })
    expect(result.current?.total).toBe(0)
  })
})
