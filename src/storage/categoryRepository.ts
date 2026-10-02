import type { Category, CategoryId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the Balance categories comes to, category by category (./recordChanges). */
export type CategoryChanges = RecordChanges<Category, CategoryId>

/**
 * Where an account's Balance categories live (BAL-1). Every call site talks to
 * this interface rather than to the service behind it, as with the tasks
 * (./taskRepository).
 *
 * Changes are written category by category, never as the whole set, so a
 * device only ever writes the categories it changed and cannot undo what
 * another device did to the rest meanwhile.
 */
export interface CategoryRepository {
  /**
   * Calls back with every saved category once they are known, and again
   * whenever they change — here, in another tab or on another device. Returns
   * the way to stop.
   */
  subscribe(onCategories: (categories: Category[]) => void, onError: (error: unknown) => void): () => void
  save(changes: CategoryChanges): Promise<void>
}
