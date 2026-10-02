import type { Firestore } from 'firebase/firestore'
import type { Category } from '../core'
import type { CategoryRepository } from './categoryRepository'
import { readCategory, toStoredCategory } from './categorySchema'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'

const CATEGORY: RecordKind<Category> = { noun: 'category', read: readCategory, write: toStoredCategory }

/**
 * An account's Balance categories in Firestore: one document per category,
 * filed under the account at `users/{accountId}/categories/{categoryId}`, and
 * readable by that account alone (`firestore.rules`). Like the tasks they open
 * offline from the browser's copy, and when two devices change the same
 * category the later write wins.
 */
export function createFirestoreCategoryRepository(firestore: Firestore, accountId: string): CategoryRepository {
  const categories = accountCollection(firestore, accountId, 'categories')

  return {
    subscribe: (onCategories, onError) => subscribeToRecords(categories, CATEGORY, onCategories, onError),
    save: (changes) => saveRecords(firestore, categories, CATEGORY, changes),
  }
}
