// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HabitRests } from '../core'
import type { HabitSettingsRepository } from '../storage/habitSettingsRepository'
import { useHabitRests } from './useHabitRests'

/* HAB ids refer to wiki/habits.md. */

/** The account's limit, answering at once as a device already holding it does — or never, while `silent`. */
function account(initial: HabitRests = null, silent = false): HabitSettingsRepository & { saved: () => HabitRests } {
  let saved = initial
  const listeners = new Set<(rests: HabitRests) => void>()
  return {
    subscribe(onRests) {
      listeners.add(onRests)
      if (!silent) onRests(saved)
      return () => listeners.delete(onRests)
    },
    async save(next) {
      saved = next
      for (const listener of listeners) listener(next)
    },
    async importRests() {
      // Nothing to move in a test.
    },
    saved: () => saved,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('the limit on rests (HAB-36)', () => {
  it('reads the limit off for an account that never switched it on', () => {
    const repository = account()
    const { result } = renderHook(() => useHabitRests(repository))

    expect(result.current.rests).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('reads it off while the account has not answered, and says it is waiting', () => {
    const repository = account({ since: '2026-10-01' }, true)
    const { result } = renderHook(() => useHabitRests(repository))

    expect(result.current.rests).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('switches it on from today, and off again with no record left', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 12, 9, 0))
    const repository = account()
    const { result } = renderHook(() => useHabitRests(repository))

    act(() => { result.current.turn(true) })
    expect(result.current.rests).toEqual({ since: '2026-10-12' })
    expect(repository.saved()).toEqual({ since: '2026-10-12' })

    act(() => { result.current.turn(false) })
    expect(result.current.rests).toBeNull()
    expect(repository.saved()).toBeNull()
  })

  it('keeps the day it began when switched on again while on', () => {
    const repository = account({ since: '2026-10-01' })
    const { result } = renderHook(() => useHabitRests(repository))

    act(() => { result.current.turn(true) })
    expect(repository.saved()).toEqual({ since: '2026-10-01' })
  })
})
