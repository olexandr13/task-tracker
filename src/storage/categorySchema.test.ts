import { describe, expect, it } from 'vitest'
import { bindTag, createCategory } from '../core'
import { CATEGORY_SCHEMA_VERSION, readCategory, toStoredCategory } from './categorySchema'

/* Reading the Balance categories back. STORE ids refer to wiki/storage.md. */

const AT = new Date('2026-09-17T09:00:00.000Z')
const REST = bindTag(bindTag(createCategory('Rest', AT), 'walk'), 'chill')

describe('readCategory (STORE-50, STORE-24)', () => {
  it('reads back what was saved', () => {
    expect(readCategory(toStoredCategory(REST))).toEqual(REST)
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
