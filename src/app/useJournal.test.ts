// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createJournalEntry, type JournalEntry, type LocalDay } from '../core'
import type { JournalChanges, JournalRepository } from '../storage/journalRepository'
import { expectConsole } from '../test/consoleGuard'
import { useJournal } from './useJournal'

/* Holding the journal. JRN ids refer to wiki/journal.md, STORE ids to wiki/storage.md. */

// Saturday 10 October 2026, nine in the evening.
const NOW = new Date(2026, 9, 10, 21, 0)
const TODAY = '2026-10-10'

function fakeRepository(initial: JournalEntry[] = [], saveFails = false) {
  const saved: JournalChanges[] = []
  const forgotten: LocalDay[] = []
  const repository: JournalRepository = {
    subscribe(onEntries) {
      onEntries(initial)
      return () => {}
    },
    save(changes) {
      saved.push(changes)
      return saveFails ? Promise.reject(new Error('permission denied')) : Promise.resolve()
    },
    forgetBefore(day) {
      forgotten.push(day)
      return Promise.resolve()
    },
  }
  return { repository, saved, forgotten }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useJournal', () => {
  it('writes a line, changes it and takes it out, saving only what changed (JRN-2, JRN-4, JRN-5)', () => {
    const { repository, saved } = fakeRepository()
    const { result } = renderHook(() => useJournal(repository))

    act(() => { result.current.add('good', ' Sun came out ', TODAY) })
    const [made] = result.current.entries
    expect(made).toMatchObject({ section: 'good', text: 'Sun came out', day: TODAY })

    act(() => { result.current.change(made.id, 'Sun came out after the rain') })
    act(() => { result.current.change(made.id, 'Sun came out after the rain') })
    act(() => { result.current.remove(made.id) })

    expect(result.current.entries).toEqual([])
    expect(saved).toEqual([
      { saved: [made], removed: [] },
      { saved: [{ ...made, text: 'Sun came out after the rain' }], removed: [] },
      { saved: [], removed: [{ ...made, text: 'Sun came out after the rain' }] },
    ])
  })

  it('puts a line just taken out back as it was, for the undo (JRN-5)', () => {
    const sunny = createJournalEntry('good', 'Sun came out', TODAY, NOW)
    const { repository } = fakeRepository([sunny])
    const { result } = renderHook(() => useJournal(repository))

    act(() => { result.current.remove(sunny.id) })
    act(() => { result.current.restore(sunny) })

    expect(result.current.entries).toEqual([sunny])
  })

  it('lets go of the days the journal no longer keeps once it has loaded (JRN-8)', () => {
    vi.useFakeTimers({ now: NOW })
    const { repository, forgotten } = fakeRepository()
    renderHook(() => useJournal(repository))

    expect(forgotten).toEqual(['2026-10-03'])
  })

  it('says on screen when a change is refused (STORE-13)', async () => {
    expectConsole('Could not save the journal.')
    const onProblem = vi.fn()
    const { repository } = fakeRepository([], true)
    const { result } = renderHook(() => useJournal(repository, onProblem))

    act(() => { result.current.add('gratitude', 'A friend called', TODAY) })
    await act(async () => { await Promise.resolve() })

    expect(onProblem).toHaveBeenCalledExactlyOnceWith('save')
  })
})
