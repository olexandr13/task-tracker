import { describe, expect, it } from 'vitest'
import { createTag } from '../core'
import { readTag, TAG_SCHEMA_VERSION, toStoredTag } from './tagSchema'

/* Reading a kept tag back. STORE ids refer to wiki/storage.md. */

const NOW = new Date('2026-09-15T10:00:00.000Z')

describe('reading a saved tag', () => {
  const work = createTag('work', NOW)

  it('reads back what it wrote', () => {
    expect(readTag(toStoredTag(work))).toEqual(work)
  })

  it('refuses a version it does not know: a shape it cannot be sure of is left unread (STORE-34)', () => {
    expect(readTag({ version: TAG_SCHEMA_VERSION + 1, tag: work })).toBe(null)
    expect(readTag({ tag: work })).toBe(null)
  })

  it('refuses anything that is not a saved tag at all', () => {
    expect(readTag(null)).toBe(null)
    expect(readTag('work')).toBe(null)
    expect(readTag([toStoredTag(work)])).toBe(null)
    expect(readTag({ version: TAG_SCHEMA_VERSION })).toBe(null)
  })

  it('refuses a tag whose fields are not what they should be', () => {
    const broken: unknown[] = [
      { ...work, id: '' },
      { ...work, name: 'two words' },
      { ...work, name: 42 },
      { ...work, createdAt: 'the other day' },
    ]

    for (const tag of broken) {
      expect(readTag({ version: TAG_SCHEMA_VERSION, tag })).toBe(null)
    }
  })
})
