import type { Category } from '../core'
import type { CategoryRepository } from './categoryRepository'
import { readCategory, toStoredCategory } from './categorySchema'
import { createLocalCollection } from './localCollection'

const STORAGE_KEY = 'task-tracker/guest/categories'

const collection = createLocalCollection<Category>({
  key: STORAGE_KEY,
  read: readCategory,
  write: toStoredCategory,
  idOf: (category) => category.id,
})

/** The guest's Balance categories in this browser — never leaves the device. */
export function createLocalCategoryRepository(): CategoryRepository {
  return {
    subscribe(onCategories, onError) {
      return collection.subscribe(onCategories, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },
  }
}

export function loadGuestCategories(): Category[] {
  return collection.load()
}

export function clearGuestCategories(): void {
  collection.clear()
}
