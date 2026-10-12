// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createNote } from '../core'
import { clearGuestNotes, createLocalNoteRepository, loadGuestNotes } from './localNoteRepository'
import { NOTE_SCHEMA_VERSION, readNote, toStoredNote } from './noteSchema'
import { changesBetween } from './recordChanges'

/* Keeping the notes. NOTE ids refer to wiki/notes.md, STORE ids to wiki/storage.md. */

const AT = new Date('2026-10-11T09:00:00.000Z')
const FILMS = { ...createNote('Films to watch\n- *Heat*', AT), id: 'films' }
const DENTIST = { ...createNote('**Dentist** in May', AT), id: 'dentist' }

afterEach(() => {
  clearGuestNotes()
})

describe('a saved note (STORE-62)', () => {
  it('is kept under its version and reads back as written', () => {
    expect(toStoredNote(FILMS)).toEqual({ version: NOTE_SCHEMA_VERSION, note: FILMS })
    expect(readNote(toStoredNote(FILMS))).toEqual(FILMS)
  })

  it('is not trusted in an unknown version, or with anything in it that is not what it should be (STORE-7)', () => {
    const stored = toStoredNote(FILMS)
    expect(readNote({ ...stored, version: NOTE_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readNote({ ...stored, note: { ...FILMS, id: '' } })).toBeNull()
    expect(readNote({ ...stored, note: { ...FILMS, text: '  ' } })).toBeNull()
    expect(readNote({ ...stored, note: { ...FILMS, text: 7 } })).toBeNull()
    expect(readNote({ ...stored, note: { ...FILMS, createdAt: 'soon' } })).toBeNull()
    expect(readNote({ ...stored, note: { ...FILMS, updatedAt: undefined } })).toBeNull()
    expect(readNote('a note')).toBeNull()
  })
})

describe('a guest’s notes (NOTE-9)', () => {
  it('are kept in this browser, note by note, a note taken out going for good', async () => {
    const repository = createLocalNoteRepository()

    await repository.save(changesBetween([], [FILMS, DENTIST]))
    expect(loadGuestNotes()).toEqual([FILMS, DENTIST])

    await repository.save(changesBetween([FILMS, DENTIST], [DENTIST]))
    expect(loadGuestNotes()).toEqual([DENTIST])
  })
})
