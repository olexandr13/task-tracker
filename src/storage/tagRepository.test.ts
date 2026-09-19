import { describe, expect, it } from 'vitest'
import { createTag } from '../core'
import { tagChangesBetween } from './tagRepository'

/* What a change to the kept tags writes. STORE ids refer to wiki/storage.md. */

const NOW = new Date('2026-09-15T10:00:00.000Z')

describe('tagChangesBetween', () => {
  const work = createTag('work', NOW)
  const home = createTag('home', NOW)

  it('writes a new tag, and no other (STORE-34)', () => {
    expect(tagChangesBetween([work], [work, home])).toEqual({ saved: [home], removed: [] })
  })

  it('removes a tag that is gone (STORE-34)', () => {
    expect(tagChangesBetween([work, home], [work])).toEqual({ saved: [], removed: [home.id] })
  })

  it('has nothing to write when nothing changed', () => {
    expect(tagChangesBetween([work, home], [work, home])).toEqual({ saved: [], removed: [] })
  })
})
