import { isRecord } from './plainData'

/** One field of a saved record and what it becomes, by its path in the document: `['task', 'order']`. */
export interface FieldChange {
  readonly path: readonly [string, ...string[]]
  readonly value: unknown
}

/**
 * What writing `next` — a record in its saved envelope, `{ version, task }` —
 * into a document last read here as `read` has to change: each field of the
 * record that differs, none when nothing does, or null when it has to be
 * written whole.
 *
 * The fields are those of the record inside the envelope (`task.order`, not
 * `task`), so a move writes the task's number alone and leaves the rest of it
 * as whoever last changed it left it (STORE-16). A field holding a list or a
 * map is changed whole.
 *
 * Whole is for a document never read here, and for one read in another version
 * than `next` is in: fields of two shapes cannot be mixed, and writing it whole
 * brings it up to today's (STORE-4). So is anything else that does not line up
 * field for field.
 */
export function changedFields(next: Readonly<Record<string, unknown>>, read: unknown): FieldChange[] | null {
  if (!isRecord(read) || read.version !== next.version || !sameKeys(next, read)) return null

  const changes: FieldChange[] = []
  for (const [key, value] of Object.entries(next)) {
    const was = read[key]
    if (isRecord(value) && isRecord(was)) {
      if (!sameKeys(value, was)) return null
      for (const [field, now] of Object.entries(value)) {
        if (!sameData(now, was[field])) changes.push({ path: [key, field], value: now })
      }
    } else if (!sameData(value, was)) {
      changes.push({ path: [key], value })
    }
  }
  return changes
}

/** Whether two values as saved hold the same: lists item by item, maps field by field in any order. */
export function sameData(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameData(item, b[index]))
  }
  if (isRecord(a) && isRecord(b)) {
    return sameKeys(a, b) && Object.keys(a).every((key) => sameData(a[key], b[key]))
  }
  return false
}

function sameKeys(a: Readonly<Record<string, unknown>>, b: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key))
}
