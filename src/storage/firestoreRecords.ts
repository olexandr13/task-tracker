import { doc, onSnapshot, type CollectionReference, type DocumentData, type Firestore, type WriteBatch } from 'firebase/firestore'
import { commitInBatches } from './firestoreBatches'
import type { RecordChanges } from './recordChanges'

/** How one kind of record — a task, a list, a tag — is kept in its own collection, one document each. */
export interface RecordKind<T> {
  /** What a record is called in a warning. */
  readonly noun: string
  /** The record in today's shape, or null when it cannot be trusted. */
  readonly read: (data: unknown) => T | null
  /** The record under the version of the shape it is saved in. */
  readonly write: (record: T) => DocumentData
}

/**
 * Calls back with every record of the collection that can be read, once they
 * are known and again whenever they change — here, in another tab or on another
 * device. One that cannot be read is left out with a warning, and left as it is
 * in the database: never overwritten or deleted by the app (STORE-7).
 */
export function subscribeToRecords<T>(
  collection: CollectionReference,
  kind: RecordKind<T>,
  onRecords: (records: T[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    collection,
    (snapshot) => {
      onRecords(
        snapshot.docs.flatMap((saved) => {
          const data = saved.data()
          const record = kind.read(data)
          if (record === null) {
            console.warn(`Ignoring saved ${kind.noun} ${saved.id}: unexpected shape (version ${String(data.version)}).`)
            return []
          }
          return [record]
        }),
      )
    },
    onError,
  )
}

/** Writes the records a change touched, each filed under its own id, and deletes the ones it removed. */
export function saveRecords<T extends { readonly id: string }>(
  firestore: Firestore,
  collection: CollectionReference,
  kind: RecordKind<T>,
  { saved, removed }: RecordChanges<T>,
): Promise<void> {
  return commitInBatches(firestore, [
    ...saved.map((record) => (batch: WriteBatch) => batch.set(doc(collection, record.id), kind.write(record))),
    ...removed.map((id) => (batch: WriteBatch) => batch.delete(doc(collection, id))),
  ])
}
