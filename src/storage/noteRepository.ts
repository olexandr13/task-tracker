import type { Note, NoteId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the notes comes to, note by note (./recordChanges). */
export type NoteChanges = RecordChanges<Note, NoteId>

/**
 * Where an account's notes live (NOTE-1). Every call site talks to this
 * interface rather than to the service behind it, as with the tasks
 * (./taskRepository).
 *
 * Changes are written note by note, never as the whole set, so a device only
 * ever writes the notes it changed and cannot undo what another device did to
 * the rest meanwhile.
 */
export interface NoteRepository {
  /**
   * Calls back with every saved note once they are known, and again whenever
   * they change — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onNotes: (notes: Note[]) => void, onError: (error: unknown) => void): () => void
  save(changes: NoteChanges): Promise<void>
}
