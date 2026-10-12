// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNote, type Note } from '../core'
import type { NoteChanges, NoteRepository } from '../storage/noteRepository'
import { expectConsole } from '../test/consoleGuard'
import { useNotes } from './useNotes'

/* Holding the notes. NOTE ids refer to wiki/notes.md, STORE ids to wiki/storage.md. */

const AT = new Date('2026-10-11T09:00:00.000Z')
const LATER = new Date('2026-10-11T10:30:00.000Z')

function fakeRepository(initial: Note[] = [], saveFails = false) {
  const saved: NoteChanges[] = []
  const repository: NoteRepository = {
    subscribe(onNotes) {
      onNotes(initial)
      return () => {}
    },
    save(changes) {
      saved.push(changes)
      return saveFails ? Promise.reject(new Error('permission denied')) : Promise.resolve()
    },
  }
  return { repository, saved }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useNotes', () => {
  it('writes a note, changes it and deletes it, saving only what changed (NOTE-3, NOTE-5, NOTE-6)', () => {
    vi.useFakeTimers({ now: AT })
    const { repository, saved } = fakeRepository()
    const { result } = renderHook(() => useNotes(repository))

    act(() => { result.current.add(' Films to watch \n') })
    const [made] = result.current.notes
    expect(made).toMatchObject({ text: 'Films to watch', createdAt: AT.toISOString(), updatedAt: AT.toISOString() })

    vi.setSystemTime(LATER)
    act(() => { result.current.change(made.id, 'Films to watch\n- *Heat*') })
    act(() => { result.current.change(made.id, 'Films to watch\n- *Heat*') })
    const changed = { ...made, text: 'Films to watch\n- *Heat*', updatedAt: LATER.toISOString() }
    act(() => { result.current.remove(made.id) })

    expect(result.current.notes).toEqual([])
    expect(saved).toEqual([
      { saved: [made], removed: [] },
      { saved: [changed], removed: [] },
      { saved: [], removed: [made.id] },
    ])
  })

  it('makes nothing of a note that says nothing, and leaves a note alone that is changed to nothing (NOTE-4)', () => {
    const films = createNote('Films to watch', AT)
    const { repository, saved } = fakeRepository([films])
    const { result } = renderHook(() => useNotes(repository))

    act(() => { expect(result.current.add('- ')).toBeNull() })
    act(() => { result.current.change(films.id, '   ') })

    expect(result.current.notes).toEqual([films])
    expect(saved).toEqual([])
  })

  it('lists the notes newest first, a note written later going on top (NOTE-2)', () => {
    vi.useFakeTimers({ now: LATER })
    const films = createNote('Films to watch', AT)
    const { repository } = fakeRepository([films])
    const { result } = renderHook(() => useNotes(repository))

    act(() => { result.current.add('Dentist in May') })

    expect(result.current.notes.map((note) => note.text)).toEqual(['Dentist in May', 'Films to watch'])
  })

  it('puts a note just deleted back as it was, for the undo (NOTE-6)', () => {
    const films = createNote('Films to watch', AT)
    const { repository } = fakeRepository([films])
    const { result } = renderHook(() => useNotes(repository))

    act(() => { result.current.remove(films.id) })
    act(() => { result.current.restore(films) })

    expect(result.current.notes).toEqual([films])
  })

  it('says on screen when a change is refused (STORE-13)', async () => {
    expectConsole('Could not save the notes.')
    const onProblem = vi.fn()
    const { repository } = fakeRepository([], true)
    const { result } = renderHook(() => useNotes(repository, onProblem))

    act(() => { result.current.add('Films to watch') })
    await act(async () => { await Promise.resolve() })

    expect(onProblem).toHaveBeenCalledExactlyOnceWith('save')
  })
})
