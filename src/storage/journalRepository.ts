import type { JournalEntry, LocalDay } from '../core'

/**
 * What one change to the journal comes to, line by line. A line taken out
 * carries its day with it: the journal is kept a day at a time
 * (./firestoreJournalRepository), and the day is where it is taken out of.
 */
export interface JournalChanges {
  /** Lines that are new, or not what they were. */
  readonly saved: readonly JournalEntry[]
  /** Lines gone, as they were — the day they were under included. */
  readonly removed: readonly JournalEntry[]
}

export function hasJournalChanges(changes: JournalChanges): boolean {
  return changes.saved.length > 0 || changes.removed.length > 0
}

/**
 * The lines that differ between two versions of the journal. The rules in
 * ../core hand back the very same object for a line they did not change, so
 * identity tells a changed line from an untouched one.
 */
export function journalChangesBetween(before: readonly JournalEntry[], after: readonly JournalEntry[]): JournalChanges {
  const previous = new Map(before.map((entry) => [entry.id, entry]))
  const next = new Set(after.map((entry) => entry.id))

  return {
    saved: after.filter((entry) => previous.get(entry.id) !== entry),
    removed: before.filter((entry) => !next.has(entry.id)),
  }
}

/**
 * Where an account's journal lives (JRN-1). Every call site talks to this
 * interface rather than to the service behind it, as with the tasks
 * (./taskRepository). Changes are written line by line, so a device only ever
 * writes the lines it changed.
 */
export interface JournalRepository {
  /**
   * Calls back with every line that can be read once they are known, and again
   * whenever they change — here, in another tab or on another device. Returns
   * the way to stop.
   */
  subscribe(onEntries: (entries: JournalEntry[]) => void, onError: (error: unknown) => void): () => void
  save(changes: JournalChanges): Promise<void>
  /** Lets go of every day before `day`, whole — the days the journal no longer keeps (JRN-8). */
  forgetBefore(day: LocalDay): Promise<void>
}
