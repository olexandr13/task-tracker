import { BONUS_PERIODS, type LocalDay, type PeriodBonuses, type TaskId } from '../core'
import {
  countRecords,
  newRecords,
  type BackupRepository,
  type KnownRecords,
} from './backupRepository'
import { clearGuestLists, createLocalListRepository, loadGuestLists } from './localListRepository'
import { clearGuestPrizes, createLocalPrizeRepository, loadGuestPrizes } from './localPrizeRepository'
import { clearGuestRewards, loadGuestLedger, replaceGuestLedger } from './localRewardRepository'
import { clearGuestTags, createLocalTagRepository, loadGuestTags } from './localTagRepository'
import { clearGuestTasks, createLocalTaskRepository, loadGuestTasks } from './localTaskRepository'

/**
 * The guest's data as a whole file — export and import stay on this device.
 * Import never needs a connection: what is already here is what is on disk.
 */
export function createLocalBackupRepository(): BackupRepository {
  const tasks = createLocalTaskRepository()
  const lists = createLocalListRepository()
  const tags = createLocalTagRepository()
  const prizes = createLocalPrizeRepository()

  return {
    async exportAll() {
      const ledger = loadGuestLedger()
      return {
        tasks: loadGuestTasks(),
        lists: loadGuestLists(),
        tags: loadGuestTags(),
        prizes: loadGuestPrizes(),
        entries: ledger.entries,
        redemptions: ledger.redemptions,
        bonuses: ledger.bonuses,
        pointValue: ledger.pointValue,
      }
    },

    async importAll(incoming, now) {
      const ledger = loadGuestLedger()
      const guestTags = loadGuestTags()
      const known: KnownRecords = {
        taskIds: new Set(loadGuestTasks().map((task) => task.id)),
        listIds: new Set(loadGuestLists().map((list) => list.id)),
        tagIds: new Set(guestTags.map((tag) => tag.id)),
        tagNames: guestTags.map((tag) => tag.name),
        prizeIds: new Set(loadGuestPrizes().map((prize) => prize.id)),
        redemptionIds: new Set(ledger.redemptions.map((redemption) => redemption.id)),
        bonuses: ledger.bonuses,
        pointValue: ledger.pointValue,
        days: daysKnown(ledger.entries),
      }

      const { fresh, alreadyHere } = newRecords(incoming, known, now)

      await tasks.importTasks(fresh.tasks)
      await lists.save({ saved: fresh.lists, removed: [] })
      await tags.save({ saved: fresh.tags, removed: [] })
      await prizes.save({ saved: fresh.prizes, removed: [] })
      // The file's bonuses and point value only where there are none here
      // already (`newRecords`).
      const bonuses = Object.fromEntries(
        BONUS_PERIODS.map((period) => [period, ledger.bonuses[period] ?? fresh.bonuses[period]]),
      ) as PeriodBonuses
      replaceGuestLedger(
        [...ledger.entries, ...fresh.entries],
        [...ledger.redemptions, ...fresh.redemptions],
        bonuses,
        ledger.pointValue ?? fresh.pointValue,
      )

      return { added: countRecords(fresh), alreadyHere }
    },
  }
}

function daysKnown(entries: ReturnType<typeof loadGuestLedger>['entries']): KnownRecords['days'] {
  const days = new Map<LocalDay, Set<TaskId>>()
  for (const entry of entries) {
    const set = days.get(entry.day) ?? new Set<TaskId>()
    set.add(entry.taskId)
    days.set(entry.day, set)
  }
  return days
}

/** Drops every guest record after it has been moved into a signed-in account. */
export function clearGuestAccount(): void {
  clearGuestTasks()
  clearGuestLists()
  clearGuestTags()
  clearGuestPrizes()
  clearGuestRewards()
}
