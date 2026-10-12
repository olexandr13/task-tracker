import { describe, expect, it } from 'vitest'
import {
  changeNoteText,
  createNote,
  InvalidNoteTextError,
  isBlankNoteText,
  normalizeNoteText,
  noteFirstLine,
  sortNotes,
  type Note,
} from './note'

/* NOTE ids refer to wiki/notes.md. */

const AT = new Date('2026-10-11T09:00:00.000Z')
const LATER = new Date('2026-10-11T10:30:00.000Z')

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'a',
    text: 'Films to watch',
    createdAt: AT.toISOString(),
    updatedAt: AT.toISOString(),
    ...overrides,
  }
}

describe('a note (NOTE-3)', () => {
  it('is what was written, trimmed at the ends, its blank lines and markers kept', () => {
    const made = createNote('  **Dentist**\n\n- floss\n- come back in May  \n', AT)

    expect(made.text).toBe('**Dentist**\n\n- floss\n- come back in May')
    expect(made.createdAt).toBe(AT.toISOString())
    expect(made.updatedAt).toBe(AT.toISOString())
    expect(made.id).not.toBe(createNote('Another', AT).id)
  })

  it('needs words: space, markers and empty list items are nothing written (NOTE-4)', () => {
    expect(isBlankNoteText('')).toBe(true)
    expect(isBlankNoteText('  \n \n')).toBe(true)
    expect(isBlankNoteText('- \n- ')).toBe(true)
    expect(isBlankNoteText('1. ')).toBe(true)
    expect(isBlankNoteText('- milk')).toBe(false)
    expect(isBlankNoteText('*')).toBe(false)
    expect(() => normalizeNoteText('-')).toThrow(InvalidNoteTextError)
    expect(() => createNote('   ', AT)).toThrow(InvalidNoteTextError)
  })
})

describe('changing a note (NOTE-5)', () => {
  it('writes the new text and when it changed, keeping its id and when it was first written', () => {
    const changed = changeNoteText(note(), 'Films to watch\n- *Heat*', LATER)

    expect(changed).toEqual(note({ text: 'Films to watch\n- *Heat*', updatedAt: LATER.toISOString() }))
  })

  it('hands back the very same note when nothing changed, so nothing is saved', () => {
    const before = note()
    expect(changeNoteText(before, '  Films to watch \n', LATER)).toBe(before)
  })

  it('refuses to leave a note blank: emptying one is deleting it, which is not a change', () => {
    expect(() => changeNoteText(note(), '- ', LATER)).toThrow(InvalidNoteTextError)
  })
})

describe('the order of the notes (NOTE-2)', () => {
  it('is newest first by when each was first written, however recently one was changed', () => {
    const old = note({ id: 'old', createdAt: '2026-10-01T09:00:00.000Z', updatedAt: LATER.toISOString() })
    const fresh = note({ id: 'fresh', createdAt: '2026-10-10T09:00:00.000Z' })
    const tie = note({ id: 'b', createdAt: '2026-10-10T09:00:00.000Z' })

    expect(sortNotes([old, tie, fresh]).map((each) => each.id)).toEqual(['b', 'fresh', 'old'])
  })
})

describe('what a note is known by', () => {
  it('is its first line with words on it, as plain words', () => {
    expect(noteFirstLine('**Dentist** on *Friday*\nfloss')).toBe('Dentist on Friday')
    expect(noteFirstLine('\n\n- \n- milk\n- eggs')).toBe('milk')
    expect(noteFirstLine('   ')).toBe('')
  })
})
