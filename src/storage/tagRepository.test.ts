import { describe, expect, it } from 'vitest'
import { createTag } from '../core'
import { changesBetween } from './recordChanges'

/* What a change to the kept tags writes. STORE ids refer to wiki/storage.md. */

const NOW = new Date('2026-09-15T10:00:00.000Z')

describe('changesBetween', () => {
  const work = createTag('work', NOW)
  const home = createTag('home', NOW)

  it('writes a new tag, and no other (STORE-34)', () => {
    expect(changesBetween([work], [work, home])).toEqual({ saved: [home], removed: [] })
  })

  it('removes a tag that is gone (STORE-34)', () => {
    expect(changesBetween([work, home], [work])).toEqual({ saved: [], removed: [home.id] })
  })

  it('has nothing to write when nothing changed', () => {
    expect(changesBetween([work, home], [work, home])).toEqual({ saved: [], removed: [] })
  })
})
