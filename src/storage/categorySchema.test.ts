import { describe, expect, it } from 'vitest'
import { bindTag, createCategory, logCategoryTime } from '../core'
import { CATEGORY_SCHEMA_VERSION, readCategory, toStoredCategory } from './categorySchema'

/* Reading the Balance categories back. STORE ids refer to wiki/storage.md. */

const AT = new Date('2026-09-17T09:00:00.000Z')
const REST = bindTag(bindTag(createCategory('Rest', AT), 'walk'), 'chill')
const LOGGED = logCategoryTime(logCategoryTime(REST, 30, AT, 'read a chapter'), 15, AT)

describe('readCategory (STORE-50, STORE-24)', () => {
  it('reads back what was saved', () => {
    expect(readCategory(toStoredCategory(REST))).toEqual(REST)
  })

  it('reads back the time logged straight to it, comments and all (BAL-14)', () => {
    expect(readCategory(toStoredCategory(LOGGED))).toEqual(LOGGED)
  })

  it('reads a category saved before time could be logged to it as having none', () => {
    const { timeLog: _none, ...before } = REST

    expect(readCategory({ version: 1, category: before })).toEqual({ ...REST, timeLog: [] })
  })

  it('trusts no category with a session not shaped as one', () => {
    const [entry] = LOGGED.timeLog
    const withEntry = (changed: object) => ({
      version: CATEGORY_SCHEMA_VERSION,
      category: { ...LOGGED, timeLog: [{ ...entry, ...changed }] },
    })

    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...LOGGED, timeLog: undefined } })).toBeNull()
    expect(readCategory(withEntry({ id: '' }))).toBeNull()
    expect(readCategory(withEntry({ seconds: 0 }))).toBeNull()
    expect(readCategory(withEntry({ seconds: 1.5 }))).toBeNull()
    expect(readCategory(withEntry({ loggedAt: 'someday' }))).toBeNull()
    expect(readCategory(withEntry({ comment: 'two\nlines' }))).toBeNull()
    expect(readCategory(withEntry({ comment: 3 }))).toBeNull()
  })

  it('trusts nothing in a version it does not know, or not shaped as a category', () => {
    expect(readCategory({ version: 99, category: REST })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, id: '' } })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, name: '  ' } })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, tags: 'walk' } })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, tags: ['two words'] } })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, tags: [3] } })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION, category: { ...REST, createdAt: 'someday' } })).toBeNull()
    expect(readCategory({ version: CATEGORY_SCHEMA_VERSION })).toBeNull()
    expect(readCategory(null)).toBeNull()
  })
})
