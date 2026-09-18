import type { List, ListId } from '../core'

/** What one change to the lists comes to, list by list. */
export interface ListChanges {
  /** Lists that are new, or not what they were. */
  readonly saved: readonly List[]
  /** Lists gone for good. */
  readonly removed: readonly ListId[]
}

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

/**
 * The lists that differ between two versions of the set. The rules in ../core
 * hand back the very same object for a list they did not change, so identity is
 * what tells a changed list from an untouched one — as with the tasks.
 */
export function listChangesBetween(before: readonly List[], after: readonly List[]): ListChanges {
  const previous = new Map(before.map((list) => [list.id, list]))
  const kept = new Set(after.map((list) => list.id))

  return {
    saved: after.filter((list) => previous.get(list.id) !== list),
    removed: before.filter((list) => !kept.has(list.id)).map((list) => list.id),
  }
}
