import { isLocalDay, isRedemptionAmount, type LocalDay, type Redemption, type RewardEntry, type TaskId } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the points ledger. Its own version, apart from the tasks':
 * a task and what its completions earned have no reason to change shape together.
 * Bump this whenever either shape below changes, and upgrade on reading.
 */
export const REWARD_SCHEMA_VERSION = 1

/**
 * What was earned on one day: an entry per task done that day, keyed by the task.
 * A day rather than an entry is the record so reading the ledger is a record a
 * day, however many tasks earned on it, and keyed by task so two devices writing
 * the same day each write their own field of it.
 */
export interface StoredRewardDay {
  version: number
  day: LocalDay
  entries: Record<TaskId, { points: number }>
}

export interface StoredRedemption {
  version: number
  redemption: Redemption
}

/** The ledger's entries as the days that hold them, earliest day first. */
export function toStoredRewardDays(entries: readonly RewardEntry[]): StoredRewardDay[] {
  const days = new Map<LocalDay, StoredRewardDay>()
  for (const { taskId, day, points } of entries) {
    const stored = days.get(day) ?? { version: REWARD_SCHEMA_VERSION, day, entries: {} }
    stored.entries[taskId] = { points }
    days.set(day, stored)
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export function toStoredRedemption(redemption: Redemption): StoredRedemption {
  return { version: REWARD_SCHEMA_VERSION, redemption }
}

/**
 * The entries a saved day holds, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be.
 */
export function readRewardDay(data: unknown): RewardEntry[] | null {
  if (!isRecord(data) || data.version !== REWARD_SCHEMA_VERSION) return null

  const { day, entries } = data
  if (typeof day !== 'string' || !isLocalDay(day) || !isRecord(entries)) return null

  const read: RewardEntry[] = []
  for (const [taskId, entry] of Object.entries(entries)) {
    if (!isRecord(entry) || typeof entry.points !== 'number' || !isRedemptionAmount(entry.points)) return null
    read.push({ taskId, day, points: entry.points })
  }
  return read
}

/** A saved redemption, or null when it can't be trusted. */
export function readRedemption(data: unknown): Redemption | null {
  if (!isRecord(data) || data.version !== REWARD_SCHEMA_VERSION || !isRecord(data.redemption)) return null

  const { id, points, note, redeemedAt } = data.redemption
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof points !== 'number' ||
    !isRedemptionAmount(points) ||
    typeof note !== 'string' ||
    typeof redeemedAt !== 'string' ||
    Number.isNaN(new Date(redeemedAt).getTime())
  ) {
    return null
  }

  return { id, points, note, redeemedAt }
}
