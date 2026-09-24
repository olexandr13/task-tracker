// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createTask, setRepeat, startWarmUp, type Task, type WarmUp } from '../core'
import type { WarmUpRepository } from '../storage/warmUpRepository'
import { expectConsole } from '../test/consoleGuard'
import { useWarmUp } from './useWarmUp'

/* Warm-up mode as the screen drives it. WARM ids refer to wiki/warm-up.md. */

const TUE = new Date(2026, 8, 1, 9, 0)
const WED = new Date(2026, 8, 2, 9, 0)
/* A month and a day on from the warm-up's first day. */
const AFTER = new Date(2026, 9, 1, 9, 0)

const DAILY = { kind: 'daily' } as const
const WEEKLY = { kind: 'weekly', weekdays: [1] } as const

function habit(title: string): Task {
  return setRepeat(createTask(title, null, TUE), DAILY, TUE)
}

/** A repository holding one warm-up in memory, as the account's would. */
function memory(initial: WarmUp | null = null) {
  let saved = initial
  let announce: ((warmUp: WarmUp | null) => void) | null = null

  const repository: WarmUpRepository = {
    subscribe(onWarmUp) {
      announce = onWarmUp
      onWarmUp(saved)
      return () => { announce = null }
    },
    save: vi.fn(async (warmUp: WarmUp | null) => {
      saved = warmUp
    }),
    importWarmUp: vi.fn(),
  }

  return {
    repository,
    /** What another device saved, arriving through the subscription. */
    arrive(warmUp: WarmUp | null) {
      act(() => { announce?.(warmUp) })
    },
  }
}

function render(repository: WarmUpRepository, tasks: Task[] | null, now = TUE) {
  return renderHook(() => useWarmUp(repository, tasks, now))
}

describe('what the warm-up reports', () => {
  it('reports nothing under way when the account has none (WARM-2)', () => {
    const { result } = render(memory().repository, [])

    expect(result.current.progress).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('reports the day and the allowance of the account’s warm-up (WARM-3, WARM-4)', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, [habit('stretch')], WED)

    expect(result.current.progress).toMatchObject({ day: 2, allowed: 2, used: 1, remaining: 1 })
  })

  it('waits for the tasks before answering, the habits being what it counts', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, null)

    expect(result.current.isLoading).toBe(true)
    expect(result.current.progress).toBeNull()
  })

  it('reports nothing once the month is served, without rewriting anything (WARM-10)', () => {
    const { repository } = memory(startWarmUp(TUE))
    const { result } = render(repository, [], AFTER)

    expect(result.current.progress).toBeNull()
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('takes on a warm-up started on another device', () => {
    const { repository, arrive } = memory()
    const { result } = render(repository, [])

    arrive(startWarmUp(TUE))
    expect(result.current.progress).toMatchObject({ day: 1 })
  })
})

describe('starting and ending it', () => {
  it('starts one on today and saves it (WARM-2)', () => {
    const { repository } = memory()
    const { result } = render(repository, [], WED)

    act(() => { result.current.start() })

    expect(repository.save).toHaveBeenCalledWith({ startedOn: '2026-09-02' })
    expect(result.current.progress).toMatchObject({ day: 1, allowed: 1 })
  })

  it('ends it at once, and asks nothing after (WARM-9)', () => {
    const { repository } = memory(startWarmUp(TUE))
    const { result } = render(repository, [habit('stretch')])

    act(() => { result.current.end() })

    expect(repository.save).toHaveBeenCalledWith(null)
    expect(result.current.progress).toBeNull()
    expect(result.current.holdsBack(DAILY)).toBe(false)
  })
})

describe('what it holds back', () => {
  it('holds a habit back once the day’s allowance is used up (WARM-4, WARM-8)', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, [habit('stretch')])

    let held = false
    act(() => { held = result.current.holdsBack(DAILY) })

    expect(held).toBe(true)
    expect(result.current.notice).toMatchObject({ day: 1, allowed: 1 })
  })

  it('lets the first habit of the first day through', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, [])

    expect(result.current.holdsBack(DAILY)).toBe(false)
    expect(result.current.notice).toBeNull()
  })

  it('never holds an ordinary task back, however many there are (WARM-5)', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, [habit('stretch')])

    expect(result.current.holdsBack(null)).toBe(false)
    expect(result.current.holdsBack(WEEKLY)).toBe(false)
  })

  it('does not hold back a habit whose own rule is being turned over (WARM-7)', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, [habit('stretch')])

    // Already a habit: the weekly-on-all-seven rule reads as daily and is no habit more.
    expect(result.current.holdsBack(DAILY, DAILY)).toBe(false)
    // Away from daily is one habit fewer, so it is never held back either.
    expect(result.current.holdsBack(WEEKLY, DAILY)).toBe(false)
  })

  it('holds nothing back while the tasks are still loading', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, null)

    expect(result.current.holdsBack(DAILY)).toBe(false)
  })

  it('holds nothing back with no warm-up under way (WARM-5)', () => {
    const { result } = render(memory().repository, [habit('stretch'), habit('read')])

    expect(result.current.holdsBack(DAILY)).toBe(false)
  })

  it('puts the notice away when asked, and when the warm-up ends', () => {
    const { result } = render(memory(startWarmUp(TUE)).repository, [habit('stretch')])

    act(() => { result.current.holdsBack(DAILY) })
    act(() => { result.current.dismissNotice() })
    expect(result.current.notice).toBeNull()

    act(() => { result.current.holdsBack(DAILY) })
    act(() => { result.current.end() })
    expect(result.current.notice).toBeNull()
  })
})

describe('when the account refuses', () => {
  it('says a load was refused, and asks nothing meanwhile (STORE-13)', () => {
    const onProblem = vi.fn()
    const repository: WarmUpRepository = {
      subscribe(_onWarmUp, onError) {
        onError(new Error('no'))
        return () => {}
      },
      save: vi.fn(),
      importWarmUp: vi.fn(),
    }

    expectConsole('Could not load the warm-up.')
    const { result } = renderHook(() => useWarmUp(repository, [], TUE, onProblem))

    expect(onProblem).toHaveBeenCalledWith('load')
    expect(result.current.progress).toBeNull()
  })

  it('says a save was refused (STORE-13)', async () => {
    const onProblem = vi.fn()
    const repository: WarmUpRepository = {
      subscribe(onWarmUp) {
        onWarmUp(null)
        return () => {}
      },
      save: vi.fn(() => Promise.reject(new Error('no'))),
      importWarmUp: vi.fn(),
    }

    expectConsole('Could not save the warm-up.')
    const { result } = renderHook(() => useWarmUp(repository, [], TUE, onProblem))
    await act(async () => { result.current.start() })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})
