import { BONUS_PERIODS, type LocalDay, type PeriodBonuses, type TaskId } from '../core'
import {
  countRecords,
  newRecords,
  type BackupRepository,
  type KnownRecords,
} from './backupRepository'
import { clearGuestActivities, createLocalActivityRepository, loadGuestActivities } from './localActivityRepository'
import { clearGuestCategories, createLocalCategoryRepository, loadGuestCategories } from './localCategoryRepository'
import { clearGuestCheckIn, createLocalCheckInRepository, loadGuestCheckIn } from './localCheckInRepository'
import { clearGuestFeatures, createLocalFeatureRepository, loadGuestFeatures } from './localFeatureRepository'
import { clearGuestHabitRests, createLocalHabitSettingsRepository, loadGuestHabitRests } from './localHabitSettingsRepository'
import { clearGuestJournal, createLocalJournalRepository, loadGuestJournal } from './localJournalRepository'
import { clearGuestLists, createLocalListRepository, loadGuestLists } from './localListRepository'
import { clearGuestNotes, createLocalNoteRepository, loadGuestNotes } from './localNoteRepository'
import { clearGuestNudge, createLocalNudgeRepository, loadGuestNudge } from './localNudgeRepository'
import { clearGuestPrizes, createLocalPrizeRepository, loadGuestPrizes } from './localPrizeRepository'
import {
  clearGuestRewards,
  loadGuestCaseSettings,
  loadGuestLedger,
  replaceGuestLedger,
} from './localRewardRepository'
import { clearGuestTags, createLocalTagRepository, loadGuestTags } from './localTagRepository'
import { clearGuestTasks, createLocalTaskRepository, loadGuestTasks } from './localTaskRepository'
import { clearGuestProcrastination } from './localProcrastinationRepository'
import { clearGuestWarmUp, createLocalWarmUpRepository, loadGuestWarmUp } from './localWarmUpRepository'

/**
 * The guest's data as a whole file — export and import stay on this device.
 * Import never needs a connection: what is already here is what is on disk.
 */
export function createLocalBackupRepository(): BackupRepository {
  const tasks = createLocalTaskRepository()
  const lists = createLocalListRepository()
  const tags = createLocalTagRepository()
  const prizes = createLocalPrizeRepository()
  const categories = createLocalCategoryRepository()
  const activities = createLocalActivityRepository()
  const checkIn = createLocalCheckInRepository()
  const warmUp = createLocalWarmUpRepository()
  const nudge = createLocalNudgeRepository()
  const features = createLocalFeatureRepository()
  const habitSettings = createLocalHabitSettingsRepository()
  const journal = createLocalJournalRepository()
  const notes = createLocalNoteRepository()

  return {
    async exportAll() {
      const ledger = loadGuestLedger()
      return {
        tasks: loadGuestTasks(),
        lists: loadGuestLists(),
        tags: loadGuestTags(),
        prizes: loadGuestPrizes(),
        categories: loadGuestCategories(),
        activities: loadGuestActivities(),
        journal: loadGuestJournal(),
        notes: loadGuestNotes(),
        entries: ledger.entries,
        redemptions: ledger.redemptions,
        bonuses: ledger.bonuses,
        pointValue: ledger.pointValue,
        cases: loadGuestCaseSettings(),
        newTaskReward: ledger.newTaskReward,
        warmUp: loadGuestWarmUp(),
        nudge: loadGuestNudge(),
        checkIn: loadGuestCheckIn(),
        features: loadGuestFeatures(),
        habitRests: loadGuestHabitRests(),
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
        categoryIds: new Set(loadGuestCategories().map((category) => category.id)),
        activityIds: new Set(loadGuestActivities().map((entry) => entry.id)),
        unreadableActivityDays: new Set(),
        journalIds: new Set(loadGuestJournal().map((entry) => entry.id)),
        unreadableJournalDays: new Set(),
        noteIds: new Set(loadGuestNotes().map((note) => note.id)),
        redemptionIds: new Set(ledger.redemptions.map((redemption) => redemption.id)),
        bonuses: ledger.bonuses,
        pointValue: ledger.pointValue,
        cases: loadGuestCaseSettings(),
        newTaskReward: ledger.newTaskReward,
        warmUp: loadGuestWarmUp(),
        nudge: loadGuestNudge(),
        checkIn: loadGuestCheckIn(),
        features: loadGuestFeatures(),
        habitRests: loadGuestHabitRests(),
        days: daysKnown(ledger.entries),
      }

      const { fresh, alreadyHere } = newRecords(incoming, known, now)

      await tasks.importTasks(fresh.tasks)
      await lists.save({ saved: fresh.lists, removed: [] })
      await tags.save({ saved: fresh.tags, removed: [] })
      await prizes.save({ saved: fresh.prizes, removed: [] })
      await categories.save({ saved: fresh.categories, removed: [] })
      await activities.save({ saved: fresh.activities, removed: [] })
      await journal.save({ saved: fresh.journal, removed: [] })
      await notes.save({ saved: fresh.notes, removed: [] })
      // The file's bonuses, point value, cases settings and new tasks' reward
      // only where there are none here already (`newRecords`).
      const bonuses = Object.fromEntries(
        BONUS_PERIODS.map((period) => [period, ledger.bonuses[period] ?? fresh.bonuses[period]]),
      ) as PeriodBonuses
      replaceGuestLedger(
        [...ledger.entries, ...fresh.entries],
        [...ledger.redemptions, ...fresh.redemptions],
        bonuses,
        ledger.pointValue ?? fresh.pointValue,
        loadGuestCaseSettings() ?? fresh.cases,
        ledger.newTaskReward ?? fresh.newTaskReward,
      )

      // The file's warm-up, nudge, check-in, switches and limit on rests only where there are none here already (`newRecords`).
      if (fresh.warmUp !== null) await warmUp.importWarmUp(fresh.warmUp)
      if (fresh.nudge !== null) await nudge.importNudge(fresh.nudge)
      if (fresh.checkIn !== null) await checkIn.importCheckIn(fresh.checkIn)
      if (fresh.features !== null) await features.importFeatures(fresh.features)
      if (fresh.habitRests !== null) await habitSettings.importRests(fresh.habitRests)

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
  clearGuestCategories()
  clearGuestActivities()
  clearGuestJournal()
  clearGuestNotes()
  clearGuestCheckIn()
  clearGuestFeatures()
  clearGuestHabitRests()
  clearGuestRewards()
  clearGuestWarmUp()
  clearGuestNudge()
  // Today's mode goes with them; it is the day's state, not a record (STORE-45).
  clearGuestProcrastination()
}
