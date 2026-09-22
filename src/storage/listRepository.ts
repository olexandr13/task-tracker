import type { List, ListId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the lists comes to, list by list (./recordChanges). */
export type ListChanges = RecordChanges<List, ListId>

/**
 * Where an account's lists live. Every call site talks to this interface rather
 * than to the service behind it, as with the tasks (./taskRepository).
 *
 * Changes are written list by list, never as the whole set, so a device only
 * ever writes the lists it changed and cannot undo what another device did to
 * the rest meanwhile.
 */
export interface ListRepository {
  /**
   * Calls back with every saved list once they are known, and again whenever
   * they change — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onLists: (lists: List[]) => void, onError: (error: unknown) => void): () => void
  save(changes: ListChanges): Promise<void>
}
