import {
  isActivityName,
  isHourOfDay,
  isLocalDay,
  isSessionSeconds,
  isStartSecond,
  type ActivityEntry,
  type LocalDay,
  type SessionRef,
} from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the activity log (ACT-1). Its own version, apart from
 * everything else's; bump it whenever a shape below changes, and upgrade on
 * reading (STORE-5).
 *
 * - 1: what, how long, and the hour.
 * - 2: and when it began in its hour, and the task session it was made from
 *   (ACT-21) — null for a record typed, as every record of version 1 is read.
 *   A day is written field by field, so a day of version 2 may still hold
 *   records written before: those fields missing are read as null too.
 */
export const ACTIVITY_SCHEMA_VERSION = 2

/** The versions read back: every one there has been. */
const READABLE_VERSIONS: readonly unknown[] = [1, ACTIVITY_SCHEMA_VERSION]

/** One record as a day holds it: the day is the day's own. */
export interface StoredActivityFields {
  activity: string
  seconds: number
  hour: number
  startSecond: number | null
  session: { taskId: string; entryId: string } | null
  loggedAt: string
}

/**
 * What was logged on one day, a field per record, keyed by the record's id. A
 * day rather than a record is what is kept in the account, so reading the log
 * costs a document a day however many records a day holds — as the points
 * ledger is kept (./rewardSchema) — and keyed by record so two devices writing
 * the same day each write their own field of it.
 */
export interface StoredActivityDay {
  version: number
  day: LocalDay
  entries: Record<string, StoredActivityFields>
}

/** One record on its own, as the guest's browser keeps it. */
export interface StoredActivityEntry {
  version: number
  entry: ActivityEntry
}

export function toStoredActivityFields(entry: ActivityEntry): StoredActivityFields {
  return {
    activity: entry.activity,
    seconds: entry.seconds,
    hour: entry.hour,
    startSecond: entry.startSecond,
    session: entry.session === null ? null : { taskId: entry.session.taskId, entryId: entry.session.entryId },
    loggedAt: entry.loggedAt,
  }
}

/** The records as the days that hold them, earliest day first. */
export function toStoredActivityDays(entries: readonly ActivityEntry[]): StoredActivityDay[] {
  const days = new Map<LocalDay, StoredActivityDay>()
  for (const entry of entries) {
    const stored = days.get(entry.day) ?? { version: ACTIVITY_SCHEMA_VERSION, day: entry.day, entries: {} }
    stored.entries[entry.id] = toStoredActivityFields(entry)
    days.set(entry.day, stored)
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export function toStoredActivityEntry(entry: ActivityEntry): StoredActivityEntry {
  return { version: ACTIVITY_SCHEMA_VERSION, entry }
}

/** The session a record names, null for none — missing, as before version 2 — or undefined when it is not one. */
function readSession(data: unknown): SessionRef | null | undefined {
  if (data === undefined || data === null) return null
  if (!isRecord(data)) return undefined
  const { taskId, entryId } = data
  if (typeof taskId !== 'string' || taskId === '' || typeof entryId !== 'string' || entryId === '') return undefined
  return { taskId, entryId }
}

/** A record's fields read back, or null when anything in them is not what it should be. */
function readFields(id: string, day: LocalDay, data: unknown): ActivityEntry | null {
  if (!isRecord(data) || id === '') return null

  const { activity, seconds, hour, loggedAt } = data
  const startSecond = data.startSecond ?? null
  const session = readSession(data.session)
  if (
    typeof activity !== 'string' ||
    !isActivityName(activity) ||
    typeof seconds !== 'number' ||
    !isSessionSeconds(seconds) ||
    !isHourOfDay(hour) ||
    (startSecond !== null && !isStartSecond(startSecond)) ||
    session === undefined ||
    typeof loggedAt !== 'string' ||
    Number.isNaN(Date.parse(loggedAt))
  ) {
    return null
  }
  return { id, activity, seconds, day, hour, startSecond, session, loggedAt }
}

/**
 * The records a saved day holds, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. A day with **no
 * records at all** is a day with nothing logged, not one that cannot be read:
 * taking out its last record deletes the last field of its map, and Firestore
 * drops an empty map rather than keeping it.
 */
export function readActivityDay(data: unknown): ActivityEntry[] | null {
  if (!isRecord(data) || !READABLE_VERSIONS.includes(data.version)) return null

  const { day, entries } = data
  if (typeof day !== 'string' || !isLocalDay(day)) return null
  if (entries === undefined) return []
  if (!isRecord(entries)) return null

  const read: ActivityEntry[] = []
  for (const [id, fields] of Object.entries(entries)) {
    const entry = readFields(id, day, fields)
    if (entry === null) return null
    read.push(entry)
  }
  return read
}

/** One record the guest's browser kept, or null when it can't be trusted. */
export function readActivityEntry(data: unknown): ActivityEntry | null {
  if (!isRecord(data) || !READABLE_VERSIONS.includes(data.version) || !isRecord(data.entry)) return null

  const { id, day } = data.entry
  if (typeof id !== 'string' || typeof day !== 'string' || !isLocalDay(day)) return null
  return readFields(id, day, data.entry)
}
