import type { Tag, TagId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the kept tags comes to, tag by tag (./recordChanges). */
export type TagChanges = RecordChanges<Tag, TagId>

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
