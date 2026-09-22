import type { Redemption, RewardEntry } from '../core'
import { isRecord } from './plainData'
import type { PointsLedger, RewardRepository } from './rewardRepository'
import {
  readRedemption,
  readRewardDay,
  readRewardGoal,
  REWARD_SCHEMA_VERSION,
  TODAY_GOAL,
  toStoredRedemption,
  toStoredRewardDays,
  toStoredRewardGoal,
  type StoredRedemption,
  type StoredRewardDay,
  type StoredRewardGoal,
} from './rewardSchema'

const STORAGE_KEY = 'task-tracker/guest/rewards'

interface StoredLedger {
  days: Record<string, StoredRewardDay>
  redemptions: Record<string, StoredRedemption>
  /** What clearing a period earns, by period (RWD-24). A period with none is not in here. */
  goals: Record<string, StoredRewardGoal>
}

type Listener = (ledger: PointsLedger) => void

const listeners = new Set<Listener>()

function empty(): StoredLedger {
  return { days: {}, redemptions: {}, goals: {} }
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
      // A ledger kept before there were bonuses holds none, rather than being
      // unreadable for the lack of them.
      goals: isRecord(parsed.goals) ? (parsed.goals as Record<string, StoredRewardGoal>) : {},
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

  const saved: unknown = stored.goals[TODAY_GOAL]
  const goal = saved === undefined ? null : readRewardGoal(saved)
  if (saved !== undefined && goal === null) console.warn('Ignoring the saved guest Today bonus: unexpected shape.')

  return { entries, redemptions, todayBonus: goal?.points ?? null }
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

    async setTodayBonus(points) {
      const stored = readStore()
      // No bonus is no record, as in the account: one shape for nothing set.
      if (points === null) delete stored.goals[TODAY_GOAL]
      else stored.goals[TODAY_GOAL] = toStoredRewardGoal(TODAY_GOAL, points)
      writeStore(stored)
      emit(stored)
    },

    async importTodayBonus(points) {
      const stored = readStore()
      if (stored.goals[TODAY_GOAL] !== undefined) return
      stored.goals[TODAY_GOAL] = toStoredRewardGoal(TODAY_GOAL, points)
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
  todayBonus: number | null,
): void {
  const stored = empty()
  for (const day of toStoredRewardDays(entries)) stored.days[day.day] = day
  for (const redemption of redemptions) stored.redemptions[redemption.id] = toStoredRedemption(redemption)
  if (todayBonus !== null) stored.goals[TODAY_GOAL] = toStoredRewardGoal(TODAY_GOAL, todayBonus)
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
