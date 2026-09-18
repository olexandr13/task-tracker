import { describe, expect, it } from 'vitest'
import { appendList, createList, renameList } from '../core'
import { listChangesBetween } from './listRepository'

const NOW = new Date('2026-09-15T10:00:00.000Z')

describe('listChangesBetween', () => {
  const work = createList('Work', NOW)
  const home = createList('Home', NOW)
  const errands = createList('Errands', NOW)

  it('writes only the list a change touched', () => {
    const renamed = renameList(home, 'House')

    expect(listChangesBetween([work, home], [work, renamed])).toEqual({ saved: [renamed], removed: [] })
  })

  it('writes a new list, and removes one that is gone', () => {
    expect(listChangesBetween([work, home], [work, errands])).toEqual({ saved: [errands], removed: [home.id] })
  })

  it('writes the list whose place changed, and no other', () => {
    const before = appendList([work], home)
    const after = appendList(before, errands)

    expect(listChangesBetween(before, after)).toEqual({ saved: [after[2]], removed: [] })
  })

  it('has nothing to write when nothing changed', () => {
    expect(listChangesBetween([work, home], [work, home])).toEqual({ saved: [], removed: [] })
  })
})
