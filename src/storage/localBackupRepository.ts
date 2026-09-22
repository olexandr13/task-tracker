import type { LocalDay, TaskId } from '../core'
import {
  countRecords,
  newRecords,
  type BackupRepository,
  type KnownRecords,
} from './backupRepository'
import { clearGuestLists, createLocalListRepository, loadGuestLists } from './localListRepository'
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

  return {
    async exportAll() {
      const ledger = loadGuestLedger()
      return {
        tasks: loadGuestTasks(),
        lists: loadGuestLists(),
        tags: loadGuestTags(),
        entries: ledger.entries,
        redemptions: ledger.redemptions,
        todayBonus: ledger.todayBonus,
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
        redemptionIds: new Set(ledger.redemptions.map((redemption) => redemption.id)),
        todayBonus: ledger.todayBonus,
        days: daysKnown(ledger.entries),
      }

      const { fresh, alreadyHere } = newRecords(incoming, known, now)

      await tasks.importTasks(fresh.tasks)
      await lists.save({ saved: fresh.lists, removed: [] })
      await tags.save({ saved: fresh.tags, removed: [] })
      replaceGuestLedger(
        [...ledger.entries, ...fresh.entries],
        [...ledger.redemptions, ...fresh.redemptions],
        // The file's bonus only where there is none here already (`newRecords`).
        ledger.todayBonus ?? fresh.todayBonus,
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
  clearGuestRewards()
}
