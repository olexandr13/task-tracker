// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createCategory, type Category } from '../core'
import { clearGuestCategories, createLocalCategoryRepository, loadGuestCategories } from './localCategoryRepository'

/* The guest's Balance categories on this device. STORE ids refer to wiki/storage.md. */

afterEach(() => {
  clearGuestCategories()
  localStorage.clear()
})

const AT = new Date('2026-09-17T09:00:00.000Z')

describe('createLocalCategoryRepository (STORE-37, STORE-50)', () => {
  it('keeps categories across a fresh repository, and removes one deleted', async () => {
    const work = { ...createCategory('Work', AT), id: 'work' }
    const rest = { ...createCategory('Rest', AT), id: 'rest' }
    await createLocalCategoryRepository().save({ saved: [work, rest], removed: [] })
    await createLocalCategoryRepository().save({ saved: [], removed: ['work'] })

    const seen: Category[][] = []
    createLocalCategoryRepository().subscribe((categories) => {
      seen.push(categories)
    }, () => {})

    expect(seen.at(-1)).toEqual([rest])
    expect(loadGuestCategories()).toEqual([rest])
  })

  it('forgets them all once moved into an account', async () => {
    await createLocalCategoryRepository().save({ saved: [createCategory('Work', AT)], removed: [] })

    clearGuestCategories()

    expect(loadGuestCategories()).toEqual([])
  })
})
