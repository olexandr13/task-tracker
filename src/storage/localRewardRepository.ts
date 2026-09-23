import { NO_BONUSES, type PeriodBonuses, type PointValue, type Redemption, type RewardEntry } from '../core'
import { isRecord } from './plainData'
import type { PointsLedger, RewardRepository } from './rewardRepository'
import {
  POINT_VALUE,
  readPointValue,
  readRedemption,
  readRewardDay,
  readRewardGoal,
  REWARD_SCHEMA_VERSION,
  toStoredPointValue,
  toStoredRedemption,
  toStoredRewardDays,
  toStoredRewardGoal,
  type StoredPointValue,
  type StoredRedemption,
  type StoredRewardDay,
  type StoredRewardGoal,
} from './rewardSchema'

const STORAGE_KEY = 'task-tracker/guest/rewards'

interface StoredLedger {
  days: Record<string, StoredRewardDay>
  redemptions: Record<string, StoredRedemption>
  /** What clearing a period earns, by period (RWD-24, RWD-29). A period with none is not in here. */
  goals: Record<string, StoredRewardGoal>
  /** The standing settings of the points, by name (RWD-31). One not set is not in here. */
  settings: Record<string, StoredPointValue>
}

type Listener = (ledger: PointsLedger) => void

const listeners = new Set<Listener>()

function empty(): StoredLedger {
  return { days: {}, redemptions: {}, goals: {}, settings: {} }
}

function readStore(): StoredLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return empty()
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.days) || !isRecord(parsed.redemptions)) return empty()
    return {
      days: parsed.days as Record<string, StoredRewardDay>,
      redemptions: parsed.redemptions as Record<string, StoredRedemption>,
      // A ledger kept before there were bonuses, or before a point had a value,
      // holds none, rather than being unreadable for the lack of them.
      goals: isRecord(parsed.goals) ? (parsed.goals as Record<string, StoredRewardGoal>) : {},
      settings: isRecord(parsed.settings) ? (parsed.settings as Record<string, StoredPointValue>) : {},
    }
  } catch (error) {
    console.warn('Ignoring saved guest rewards: could not be read.', error)
    return empty()
  }
}

function writeStore(stored: StoredLedger): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Could not save guest rewards.', error)
    throw error
  }
}

function toLedger(stored: StoredLedger): PointsLedger {
  const entries: RewardEntry[] = []
  for (const [id, data] of Object.entries(stored.days)) {
    const read = readRewardDay(data)
    if (read === null) {
      console.warn(`Ignoring saved guest rewards for ${id}: unexpected shape.`)
      continue
    }
    entries.push(...read)
  }

  const redemptions: Redemption[] = []
  for (const [id, data] of Object.entries(stored.redemptions)) {
    const read = readRedemption(data)
    if (read === null) {
      console.warn(`Ignoring saved guest redemption ${id}: unexpected shape.`)
      continue
    }
    redemptions.push(read)
  }

  const bonuses: Record<string, number | null> = { ...NO_BONUSES }
  for (const [period, data] of Object.entries(stored.goals)) {
    const goal = readRewardGoal(data)
    if (goal === null) {
      console.warn(`Ignoring the saved guest bonus for ${period}: unexpected shape.`)
      continue
    }
    bonuses[goal.period] = goal.points
  }

  const savedValue: unknown = stored.settings[POINT_VALUE]
  const pointValue = savedValue === undefined ? null : readPointValue(savedValue)
  if (savedValue !== undefined && pointValue === null) {
    console.warn('Ignoring the saved guest point value: unexpected shape.')
  }

  return { entries, redemptions, bonuses: bonuses as PeriodBonuses, pointValue }
}

function emit(stored: StoredLedger): void {
  const ledger = toLedger(stored)
  for (const listener of listeners) listener(ledger)
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's points ledger in this browser. Same field-by-field day shape as
 * the account's, never leaves the device.
 */
export function createLocalRewardRepository(): RewardRepository {
  return {
    subscribe(onLedger, onError) {
      listeners.add(onLedger)
      try {
        onLedger(toLedger(readStore()))
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onLedger)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async save({ earned, revoked }) {
      const stored = readStore()
      for (const { taskId, day, points } of earned) {
        const existing = stored.days[day] ?? { version: REWARD_SCHEMA_VERSION, day, entries: {} }
        stored.days[day] = {
          version: REWARD_SCHEMA_VERSION,
          day,
          entries: { ...existing.entries, [taskId]: { points } },
        }
      }
      for (const { taskId, day } of revoked) {
        const existing = stored.days[day]
        if (existing === undefined) continue
        const rest = { ...existing.entries }
        delete rest[taskId]
        if (Object.keys(rest).length === 0) delete stored.days[day]
        else stored.days[day] = { ...existing, entries: rest }
      }
      writeStore(stored)
      emit(stored)
    },

    async redeem(redemption) {
      const stored = readStore()
      stored.redemptions[redemption.id] = toStoredRedemption(redemption)
      writeStore(stored)
      emit(stored)
    },

    async removeRedemption(id) {
      const stored = readStore()
      delete stored.redemptions[id]
      writeStore(stored)
      emit(stored)
    },

    async setBonus(period, points) {
      const stored = readStore()
      // No bonus is no record, as in the account: one shape for nothing set.
      if (points === null) delete stored.goals[period]
      else stored.goals[period] = toStoredRewardGoal(period, points)
      writeStore(stored)
      emit(stored)
    },

    async setPointValue(value) {
      const stored = readStore()
      if (value === null) delete stored.settings[POINT_VALUE]
      else stored.settings[POINT_VALUE] = toStoredPointValue(value)
      writeStore(stored)
      emit(stored)
    },

    async importBonus(period, points) {
      const stored = readStore()
      if (stored.goals[period] !== undefined) return
      stored.goals[period] = toStoredRewardGoal(period, points)
      writeStore(stored)
      emit(stored)
    },

    async importPointValue(value) {
      const stored = readStore()
      if (stored.settings[POINT_VALUE] !== undefined) return
      stored.settings[POINT_VALUE] = toStoredPointValue(value)
      writeStore(stored)
      emit(stored)
    },
  }
}

export function loadGuestLedger(): PointsLedger {
  return toLedger(readStore())
}

/** Writes a full ledger (backup import), merging days field by field. */
export function replaceGuestLedger(
  entries: readonly RewardEntry[],
  redemptions: readonly Redemption[],
  bonuses: PeriodBonuses,
  pointValue: PointValue | null,
): void {
  const stored = empty()
  for (const day of toStoredRewardDays(entries)) stored.days[day.day] = day
  for (const redemption of redemptions) stored.redemptions[redemption.id] = toStoredRedemption(redemption)
  for (const [period, points] of Object.entries(bonuses)) {
    if (points !== null) stored.goals[period] = toStoredRewardGoal(period as keyof PeriodBonuses, points)
  }
  if (pointValue !== null) stored.settings[POINT_VALUE] = toStoredPointValue(pointValue)
  writeStore(stored)
  emit(stored)
}

export function clearGuestRewards(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(empty())
}
