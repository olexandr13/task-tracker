import type { Firestore } from 'firebase/firestore'
import type { Note } from '../core'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'
import type { NoteRepository } from './noteRepository'
import { readNote, toStoredNote } from './noteSchema'

const NOTE: RecordKind<Note> = { noun: 'note', read: readNote, write: toStoredNote }

/**
 * An account's notes in Firestore: one document per note, filed under the
 * account at `users/{accountId}/notes/{noteId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Like the tasks they open offline from the browser's copy, and when two
 * devices change the same note the later write wins.
 */
export function createFirestoreNoteRepository(firestore: Firestore, accountId: string): NoteRepository {
  const notes = accountCollection(firestore, accountId, 'notes')

  return {
    subscribe: (onNotes, onError) => subscribeToRecords(notes, NOTE, onNotes, onError),
    save: (changes) => saveRecords(firestore, notes, NOTE, changes),
  }
}
