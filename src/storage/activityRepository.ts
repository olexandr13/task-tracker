import type { ActivityEntry } from '../core'

/**
 * What one change to the activity log comes to, record by record. A record taken
 * out carries its day with it: the log is kept a day at a time
 * (./firestoreActivityRepository), and the day is where it is taken out of.
 */
export interface ActivityChanges {
  /** Records that are new, or not what they were. */
  readonly saved: readonly ActivityEntry[]
  /** Records gone, as they were — the day they were under included. */
  readonly removed: readonly ActivityEntry[]
}

export function hasActivityChanges(changes: ActivityChanges): boolean {
  return changes.saved.length > 0 || changes.removed.length > 0
}

/**
 * The records that differ between two versions of the log. The rules in ../core
 * hand back the very same object for a record they did not change, so identity
 * tells a changed record from an untouched one. A record moved to another day is
 * taken out of the one it was under as well as saved under the new one.
 */
export function activityChangesBetween(before: readonly ActivityEntry[], after: readonly ActivityEntry[]): ActivityChanges {
  const previous = new Map(before.map((entry) => [entry.id, entry]))
  const next = new Map(after.map((entry) => [entry.id, entry]))

  return {
    saved: after.filter((entry) => previous.get(entry.id) !== entry),
    removed: before.filter((entry) => next.get(entry.id)?.day !== entry.day),
  }
}

/**
 * Where an account's activity log lives (ACT-1). Every call site talks to this
 * interface rather than to the service behind it, as with the tasks
 * (./taskRepository). Changes are written record by record, so a device only
 * ever writes the records it changed.
 */
export interface ActivityRepository {
  /**
   * Calls back with every record that can be read once they are known, and
   * again whenever they change — here, in another tab or on another device.
   * Returns the way to stop.
   */
  subscribe(onEntries: (entries: ActivityEntry[]) => void, onError: (error: unknown) => void): () => void
  save(changes: ActivityChanges): Promise<void>
}
