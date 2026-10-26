import {
  doc,
  FieldPath,
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from 'firebase/firestore'
import { commitInBatches } from './firestoreBatches'
import type { RecordChanges } from './recordChanges'
import { changedFields, type FieldChange } from './recordFields'

/** How one kind of record — a task, a list, a tag — is kept in its own collection, one document each. */
export interface RecordKind<T> {
  /** What a record is called in a warning. */
  readonly noun: string
  /** The record in today's shape, or null when it cannot be trusted. */
  readonly read: (data: unknown) => T | null
  /** The record under the version of the shape it is saved in. */
  readonly write: (record: T) => DocumentData
}

// What this device last read of each record, as it was saved, by the path of its
// document — from any listener, the account's own or a list shared with it. A
// change to a record is written against it (`writeRecord`).
const lastRead = new Map<string, DocumentData>()

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
    lastRead.set(saved.ref.path, data)
    return [record]
  })
}

/**
 * Puts writing `record` at `ref` in the batch. A record read there already, in
 * the version it is written in, has only the fields that differ from what was
 * read written — nothing at all when none do — so what another device changed
 * in the rest of it meanwhile stands (STORE-16): a task moved on one device
 * keeps its place when another ticks it off. Anything else is written whole:
 * new, never read on this device, or kept in an older shape, which this brings
 * up to today's.
 */
export function writeRecord<T>(batch: WriteBatch, ref: DocumentReference, kind: RecordKind<T>, record: T): void {
  const stored = kind.write(record)
  const changes = changedFields(stored, lastRead.get(ref.path))
  if (changes === null) {
    batch.set(ref, stored)
    return
  }

  const [first, ...rest] = changes
  if (first === undefined) return
  batch.update(ref, fieldPath(first), first.value, ...rest.flatMap((change) => [fieldPath(change), change.value]))
}

/** Puts deleting the record at `ref` in the batch, forgetting what was read there. */
export function deleteRecord(batch: WriteBatch, ref: DocumentReference): void {
  lastRead.delete(ref.path)
  batch.delete(ref)
}

function fieldPath({ path }: FieldChange): FieldPath {
  return new FieldPath(...path)
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

/**
 * Writes the records a change touched, each filed under its own id and only as
 * far as it changed (`writeRecord`), and deletes the ones it removed.
 */
export function saveRecords<T extends { readonly id: string }>(
  firestore: Firestore,
  collection: CollectionReference,
  kind: RecordKind<T>,
  { saved, removed }: RecordChanges<T>,
): Promise<void> {
  return commitInBatches(firestore, [
    ...saved.map((record) => (batch: WriteBatch) => { writeRecord(batch, doc(collection, record.id), kind, record) }),
    ...removed.map((id) => (batch: WriteBatch) => { deleteRecord(batch, doc(collection, id)) }),
  ])
}
