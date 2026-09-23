import {
  BONUS_PERIODS,
  isCurrency,
  isLocalDay,
  isPointAmount,
  isRedemptionAmount,
  isRewardAmount,
  type LocalDay,
  type Period,
  type PointValue,
  type Redemption,
  type RewardEntry,
  type TaskId,
} from '../core'
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
 *
 * A day with **no entries at all** is a day that earned nothing, not a day that
 * cannot be read: taking back the last of what a day earned deletes the last
 * field of its map, and Firestore drops an empty map rather than keeping it, so
 * the record left behind holds only its version and its day.
 */
export function readRewardDay(data: unknown): RewardEntry[] | null {
  if (!isRecord(data) || data.version !== REWARD_SCHEMA_VERSION) return null

  const { day, entries } = data
  if (typeof day !== 'string' || !isLocalDay(day)) return null
  if (entries === undefined) return []
  if (!isRecord(entries)) return null

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

/**
 * A standing amount the account earns for clearing a period — Today, this week
 * or this month (RWD-24, RWD-29). One record per period, named by the period
 * rather than by an id of its own, so the two devices that set it write the one
 * record and the later write wins. It is saved under the ledger's version: an
 * amount and what a completion earned have every reason to change shape together.
 */
export interface StoredRewardGoal {
  version: number
  goal: { period: Period; points: number }
}

export function toStoredRewardGoal(period: Period, points: number): StoredRewardGoal {
  return { version: REWARD_SCHEMA_VERSION, goal: { period, points } }
}

/** A saved bonus, or null when it can't be trusted. */
export function readRewardGoal(data: unknown): { period: Period; points: number } | null {
  if (!isRecord(data) || data.version !== REWARD_SCHEMA_VERSION || !isRecord(data.goal)) return null

  const { period, points } = data.goal
  if (
    typeof period !== 'string' ||
    !(BONUS_PERIODS as readonly string[]).includes(period) ||
    typeof points !== 'number' ||
    !isRewardAmount(points)
  ) {
    return null
  }

  return { period: period as Period, points }
}

/**
 * A standing setting of the points, kept one record per setting under a name of
 * its own rather than an id — the same reasoning as a bonus above. What one
 * point is worth (RWD-31) is the only one so far.
 */
export type RewardSetting = 'pointValue'

export const POINT_VALUE: RewardSetting = 'pointValue'

export interface StoredPointValue {
  version: number
  name: RewardSetting
  value: PointValue
}

export function toStoredPointValue(value: PointValue): StoredPointValue {
  return { version: REWARD_SCHEMA_VERSION, name: POINT_VALUE, value }
}

/** A saved point value, or null when it can't be trusted. */
export function readPointValue(data: unknown): PointValue | null {
  if (!isRecord(data) || data.version !== REWARD_SCHEMA_VERSION || data.name !== POINT_VALUE || !isRecord(data.value)) {
    return null
  }

  const { amount, currency } = data.value
  if (typeof amount !== 'number' || !isPointAmount(amount) || typeof currency !== 'string' || !isCurrency(currency)) {
    return null
  }

  return { amount, currency }
}
