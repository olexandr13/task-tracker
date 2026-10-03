import {
  doc,
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from 'firebase/firestore'
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
 * The records among `docs` that can be read. One that cannot is left out with a
 * warning, and left as it is in the database: never overwritten or deleted by
 * the app (STORE-7). Given `warned`, a record is warned about once however many
 * answers carry it.
 */
export function readRecords<T>(docs: readonly QueryDocumentSnapshot[], kind: RecordKind<T>, warned?: Set<string>): T[] {
  return docs.flatMap((saved) => {
    const data = saved.data()
    const record = kind.read(data)
    if (record === null) {
      if (warned?.has(saved.id) !== true) {
        warned?.add(saved.id)
        console.warn(`Ignoring saved ${kind.noun} ${saved.id}: unexpected shape (version ${String(data.version)}).`)
      }
      return []
    }
    return [record]
  })
}

/**
 * Calls back with every record of the collection that can be read
 * (`readRecords`), once they are known and again whenever they change — here,
 * in another tab or on another device.
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
      onRecords(readRecords(snapshot.docs, kind))
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
