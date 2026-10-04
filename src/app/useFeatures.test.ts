// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectConsole } from '../test/consoleGuard'
import type { FeaturesOff } from '../core'
import type { FeatureRepository } from '../storage/featureRepository'
import { useFeatures } from './useFeatures'

/* FEAT ids refer to wiki/features.md. */

/** The account's switches, answering at once as a device already holding them does — or never, while `silent`. */
function account(initial: FeaturesOff | null = null, silent = false): FeatureRepository & { saved: () => FeaturesOff | null } {
  let saved = initial
  const listeners = new Set<(off: FeaturesOff | null) => void>()
  return {
    subscribe(onFeatures) {
      listeners.add(onFeatures)
      if (!silent) onFeatures(saved)
      return () => listeners.delete(onFeatures)
    },
    async save(next) {
      saved = next
      for (const listener of listeners) listener(next)
    },
    async importFeatures() {
      // Nothing to move in a test.
    },
    saved: () => saved,
  }
}

describe('the feature switches (FEAT-1)', () => {
  it('reads everything on for an account that never switched anything off', () => {
    const repository = account()
    const { result } = renderHook(() => useFeatures(repository))

    expect(result.current.off).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('reads everything on while the account has not answered, and says it is waiting (FEAT-8)', () => {
    const repository = account(['rewards'], true)
    const { result } = renderHook(() => useFeatures(repository))

    expect(result.current.off).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('switches a feature off and on again, keeping it in the account', () => {
    const repository = account()
    const { result } = renderHook(() => useFeatures(repository))

    act(() => { result.current.turn('balance', false) })
    expect(result.current.off).toEqual(['balance'])
    expect(repository.saved()).toEqual(['balance'])

    act(() => { result.current.turn('balance', true) })
    expect(result.current.off).toEqual([])
  })

  it('counts two switches turned in a row, the second building on the first (STORE-39)', () => {
    const repository = account()
    const { result } = renderHook(() => useFeatures(repository))

    act(() => {
      result.current.turn('quote', false)
      result.current.turn('progress', false)
    })

    expect(repository.saved()).toEqual(['progress', 'quote'])
  })

  it('takes a change made on another device', () => {
    const repository = account()
    const { result } = renderHook(() => useFeatures(repository))

    act(() => { void repository.save(['habits']) })

    expect(result.current.off).toEqual(['habits'])
  })

  it('says so when the account refuses to keep a change (STORE-13)', async () => {
    const repository = { ...account(), save: vi.fn(() => Promise.reject(new Error('denied'))) }
    const report = vi.fn()
    const { result } = renderHook(() => useFeatures(repository, report))
    expectConsole('error', 'Could not save the feature switches.')

    await act(async () => { result.current.turn('quote', false) })

    expect(report).toHaveBeenCalledWith('save')
  })
})
