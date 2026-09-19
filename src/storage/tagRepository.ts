import type { Tag, TagId } from '../core'

/** What one change to the kept tags comes to, tag by tag. */
export interface TagChanges {
  /** Tags that are new, or not what they were. */
  readonly saved: readonly Tag[]
  /** Tags gone for good. */
  readonly removed: readonly TagId[]
}

/**
 * Where an account's tags are kept. Every call site talks to this interface
 * rather than to the service behind it, as with the tasks (./taskRepository).
 *
 * Changes are written tag by tag, never as the whole set, so a device only ever
 * writes the tags it changed and cannot undo what another device did to the rest
 * meanwhile.
 */
export interface TagRepository {
  /**
   * Calls back with every kept tag once they are known, and again whenever they
   * change — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onTags: (tags: Tag[]) => void, onError: (error: unknown) => void): () => void
  save(changes: TagChanges): Promise<void>
}

/**
 * The tags that differ between two versions of the set. Identity is what tells a
 * changed tag from an untouched one, as with the lists (./listRepository).
 */
export function tagChangesBetween(before: readonly Tag[], after: readonly Tag[]): TagChanges {
  const previous = new Map(before.map((tag) => [tag.id, tag]))
  const kept = new Set(after.map((tag) => tag.id))

  return {
    saved: after.filter((tag) => previous.get(tag.id) !== tag),
    removed: before.filter((tag) => !kept.has(tag.id)).map((tag) => tag.id),
  }
}
