import { isJournalSection, isJournalText, isLocalDay, type JournalEntry, type LocalDay } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the journal (JRN-1). Its own version, apart from
 * everything else's; bump it whenever a shape below changes, and upgrade on
 * reading (STORE-5).
 *
 * - 1: the section, what was written, and when.
 */
export const JOURNAL_SCHEMA_VERSION = 1

/** One line as a day holds it: the day is the day's own. */
export interface StoredJournalFields {
  section: string
  text: string
  writtenAt: string
}

/**
 * What was written about one day, a field per line, keyed by the line's id. A
 * day rather than a line is what is kept in the account, as the activity log
 * is (./activitySchema), so reading the journal costs a document a day, and
 * keyed by line so two devices writing the same day each write their own field.
 */
export interface StoredJournalDay {
  version: number
  day: LocalDay
  entries: Record<string, StoredJournalFields>
}

/** One line on its own, as the guest's browser keeps it. */
export interface StoredJournalEntry {
  version: number
  entry: JournalEntry
}

export function toStoredJournalFields(entry: JournalEntry): StoredJournalFields {
  return { section: entry.section, text: entry.text, writtenAt: entry.writtenAt }
}

/** The lines as the days that hold them, earliest day first. */
export function toStoredJournalDays(entries: readonly JournalEntry[]): StoredJournalDay[] {
  const days = new Map<LocalDay, StoredJournalDay>()
  for (const entry of entries) {
    const stored = days.get(entry.day) ?? { version: JOURNAL_SCHEMA_VERSION, day: entry.day, entries: {} }
    stored.entries[entry.id] = toStoredJournalFields(entry)
    days.set(entry.day, stored)
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export function toStoredJournalEntry(entry: JournalEntry): StoredJournalEntry {
  return { version: JOURNAL_SCHEMA_VERSION, entry }
}

/** A line's fields read back, or null when anything in them is not what it should be. */
function readFields(id: string, day: LocalDay, data: unknown): JournalEntry | null {
  if (!isRecord(data) || id === '') return null

  const { section, text, writtenAt } = data
  if (
    !isJournalSection(section) ||
    typeof text !== 'string' ||
    !isJournalText(text) ||
    typeof writtenAt !== 'string' ||
    Number.isNaN(Date.parse(writtenAt))
  ) {
    return null
  }
  return { id, day, section, text, writtenAt }
}

/**
 * The lines a saved day holds, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. A day with **no
 * lines at all** is a day with nothing written, not one that cannot be read:
 * taking out its last line deletes the last field of its map, and Firestore
 * drops an empty map rather than keeping it.
 */
export function readJournalDay(data: unknown): JournalEntry[] | null {
  if (!isRecord(data) || data.version !== JOURNAL_SCHEMA_VERSION) return null

  const { day, entries } = data
  if (typeof day !== 'string' || !isLocalDay(day)) return null
  if (entries === undefined) return []
  if (!isRecord(entries)) return null

  const read: JournalEntry[] = []
  for (const [id, fields] of Object.entries(entries)) {
    const entry = readFields(id, day, fields)
    if (entry === null) return null
    read.push(entry)
  }
  return read
}

/** One line the guest's browser kept, or null when it can't be trusted. */
export function readJournalEntry(data: unknown): JournalEntry | null {
  if (!isRecord(data) || data.version !== JOURNAL_SCHEMA_VERSION || !isRecord(data.entry)) return null

  const { id, day } = data.entry
  if (typeof id !== 'string' || typeof day !== 'string' || !isLocalDay(day)) return null
  return readFields(id, day, data.entry)
}
