/**
 * What one change to a set of records comes to, record by record — the tasks,
 * the lists, the kept tags. Every repository writes changes this way rather
 * than the whole set, so a device only ever writes the records it changed and
 * cannot undo what another device did to the rest meanwhile.
 */
export interface RecordChanges<T, Id extends string = string> {
  /** Records that are new, or not what they were. */
  readonly saved: readonly T[]
  /** Records gone for good — purged, not merely trashed. */
  readonly removed: readonly Id[]
}

export function hasChanges(changes: RecordChanges<unknown>): boolean {
  return changes.saved.length > 0 || changes.removed.length > 0
}

/**
 * The records that differ between two versions of a set. The rules in ../core
 * hand back the very same object for a record they did not change, so identity
 * is what tells a changed record from an untouched one.
 */
export function changesBetween<T extends { readonly id: Id }, Id extends string = string>(
  before: readonly T[],
  after: readonly T[],
): RecordChanges<T, Id> {
  const previous = new Map(before.map((record) => [record.id, record]))
  const kept = new Set(after.map((record) => record.id))

  return {
    saved: after.filter((record) => previous.get(record.id) !== record),
    removed: before.filter((record) => !kept.has(record.id)).map((record) => record.id),
  }
}
