import { describe, expect, it } from 'vitest'
import { createList } from '../core'
import { LIST_SCHEMA_VERSION, readList, toStoredList } from './listSchema'

const NOW = new Date('2026-09-15T10:00:00.000Z')

describe('reading a saved list', () => {
  const work = { ...createList('Work', NOW), order: 1024 }

  it('reads back what it wrote', () => {
    expect(readList(toStoredList(work))).toEqual(work)
  })

  it('refuses a version it does not know: a shape it cannot be sure of is left unread', () => {
    expect(readList({ version: LIST_SCHEMA_VERSION + 1, list: work })).toBe(null)
    expect(readList({ list: work })).toBe(null)
  })

  it('refuses anything that is not a saved list at all', () => {
    expect(readList(null)).toBe(null)
    expect(readList('Work')).toBe(null)
    expect(readList([toStoredList(work)])).toBe(null)
    expect(readList({ version: LIST_SCHEMA_VERSION })).toBe(null)
  })

  it('refuses a list whose fields are not what they should be', () => {
    const broken: unknown[] = [
      { ...work, id: '' },
      { ...work, name: '   ' },
      { ...work, name: 42 },
      { ...work, createdAt: 'the other day' },
      { ...work, order: 'first' },
      { ...work, order: Number.NaN },
    ]

    for (const list of broken) {
      expect(readList({ version: LIST_SCHEMA_VERSION, list })).toBe(null)
    }
  })
})
