import {
  doc,
  FirestoreError,
  getDocs,
  getDocsFromServer,
  type CollectionReference,
  type Firestore,
  type QuerySnapshot,
  type WriteBatch,
} from 'firebase/firestore'
import { BONUS_PERIODS, NO_BONUSES, type LocalDay, type PeriodBonuses, type TaskId } from '../core'
import { readActivityDay, toStoredActivityDays } from './activitySchema'
import { countRecords, NeedsConnectionError, newRecords, type BackupRepository, type KnownRecords } from './backupRepository'
import { readCategory, toStoredCategory } from './categorySchema'
import { CHECK_IN, readCheckIn, toStoredCheckIn } from './checkInSchema'
import { FEATURES_RECORD, readFeatures, toStoredFeatures } from './featureSchema'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import { readList, toStoredList } from './listSchema'
import { NUDGE, readNudge, toStoredNudge } from './nudgeSchema'
import { readPrize, toStoredPrize } from './prizeSchema'
import {
  CASES_SETTING,
  POINT_VALUE,
  readCaseSettings,
  readPointValue,
  readRedemption,
  readRewardDay,
  readRewardGoal,
  toStoredCaseSettings,
  toStoredPointValue,
  toStoredRedemption,
  toStoredRewardDays,
  toStoredRewardGoal,
} from './rewardSchema'
import { readTag, toStoredTag } from './tagSchema'
import { readStoredTask, toStoredTask } from './taskSchema'
import { readWarmUp, toStoredWarmUp, WARM_UP } from './warmUpSchema'

/** Every document of each collection, from the server, or `NeedsConnectionError` without one. */
async function fromServer(collections: readonly CollectionReference[]): Promise<QuerySnapshot[]> {
  try {
    return await Promise.all(collections.map((collection) => getDocsFromServer(collection)))
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'unavailable') throw new NeedsConnectionError()
    throw error
  }
}

const ids = (snapshot: QuerySnapshot) => new Set(snapshot.docs.map((saved) => saved.id))

/**
 * An account's data in Firestore, read and added to whole, across the
 * collections the other repositories keep one kind each of (`firestoreAccount.ts`).
 * Records the app cannot read are left out of an export and never written over
 * by an import, as everywhere else (STORE-7).
 */
export function createFirestoreBackupRepository(firestore: Firestore, accountId: string): BackupRepository {
  const tasks = accountCollection(firestore, accountId, 'tasks')
  const lists = accountCollection(firestore, accountId, 'lists')
  const tags = accountCollection(firestore, accountId, 'tags')
  const prizes = accountCollection(firestore, accountId, 'prizes')
  const days = accountCollection(firestore, accountId, 'rewardDays')
  const redemptions = accountCollection(firestore, accountId, 'redemptions')
  const goals = accountCollection(firestore, accountId, 'rewardGoals')
  const settings = accountCollection(firestore, accountId, 'rewardSettings')
  const warmUps = accountCollection(firestore, accountId, 'warmUp')
  const nudges = accountCollection(firestore, accountId, 'nudge')
  const categories = accountCollection(firestore, accountId, 'categories')
  const activityDays = accountCollection(firestore, accountId, 'activityDays')
  const checkIns = accountCollection(firestore, accountId, 'checkIn')
  const featureSwitches = accountCollection(firestore, accountId, 'features')

  /** What the account earns for clearing each period, of everything its goals hold. */
  function bonusesIn(snapshot: QuerySnapshot): PeriodBonuses {
    const bonuses = { ...NO_BONUSES } as Record<string, number | null>
    for (const goal of snapshot.docs.flatMap((saved) => readRewardGoal(saved.data()) ?? [])) {
      bonuses[goal.period] = goal.points
    }
    return bonuses as PeriodBonuses
  }

  /** What the account says a point is worth, of everything its settings hold. */
  const pointValueIn = (snapshot: QuerySnapshot) =>
    snapshot.docs.flatMap((saved) => (saved.id === POINT_VALUE ? (readPointValue(saved.data()) ?? []) : []))[0] ?? null

  /** What the account asks of Cases, of everything its settings hold. */
  const casesIn = (snapshot: QuerySnapshot) =>
    snapshot.docs.flatMap((saved) => (saved.id === CASES_SETTING ? (readCaseSettings(saved.data()) ?? []) : []))[0] ?? null

  /** The warm-up the account has, of the one document it is ever kept as. */
  const warmUpIn = (snapshot: QuerySnapshot) =>
    snapshot.docs.flatMap((saved) => (saved.id === WARM_UP ? (readWarmUp(saved.data()) ?? []) : []))[0] ?? null

  /** How the account asked to be nudged, of the one document it is ever kept as. */
  const nudgeIn = (snapshot: QuerySnapshot) =>
    snapshot.docs.flatMap((saved) => (saved.id === NUDGE ? (readNudge(saved.data()) ?? []) : []))[0] ?? null

  /** How the account asked to be checked in on, of the one document it is ever kept as. */
  const checkInIn = (snapshot: QuerySnapshot) =>
    snapshot.docs.flatMap((saved) => (saved.id === CHECK_IN ? (readCheckIn(saved.data()) ?? []) : []))[0] ?? null

  /** The features the account has switched off, of the one document they are ever kept as. */
  function featuresIn(snapshot: QuerySnapshot) {
    const saved = snapshot.docs.find((candidate) => candidate.id === FEATURES_RECORD)
    return saved === undefined ? null : readFeatures(saved.data())
  }

  return {
    // The server when there is a connection, the browser's copy when there is not.
    async exportAll() {
      const [
        savedTasks,
        savedLists,
        savedTags,
        savedPrizes,
        savedDays,
        savedRedemptions,
        savedGoals,
        savedSettings,
        savedWarmUp,
        savedNudge,
        savedCategories,
        savedActivityDays,
        savedCheckIn,
        savedFeatures,
      ] = await Promise.all(
        [
          tasks,
          lists,
          tags,
          prizes,
          days,
          redemptions,
          goals,
          settings,
          warmUps,
          nudges,
          categories,
          activityDays,
          checkIns,
          featureSwitches,
        ].map((collection) => getDocs(collection)),
      )
      const readAll = <T>(snapshot: QuerySnapshot, read: (data: unknown) => T | null): T[] =>
        snapshot.docs.flatMap((saved) => read(saved.data()) ?? [])

      return {
        tasks: readAll(savedTasks, readStoredTask),
        lists: readAll(savedLists, readList),
        tags: readAll(savedTags, readTag),
        prizes: readAll(savedPrizes, readPrize),
        categories: readAll(savedCategories, readCategory),
        activities: readAll(savedActivityDays, readActivityDay).flat(),
        entries: readAll(savedDays, readRewardDay).flat(),
        redemptions: readAll(savedRedemptions, readRedemption),
        bonuses: bonusesIn(savedGoals),
        pointValue: pointValueIn(savedSettings),
        cases: casesIn(savedSettings),
        warmUp: warmUpIn(savedWarmUp),
        nudge: nudgeIn(savedNudge),
        checkIn: checkInIn(savedCheckIn),
        features: featuresIn(savedFeatures),
      }
    },

    async importAll(incoming, now) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new NeedsConnectionError()
      const [
        savedTasks,
        savedLists,
        savedTags,
        savedPrizes,
        savedDays,
        savedRedemptions,
        savedGoals,
        savedSettings,
        savedWarmUp,
        savedNudge,
        savedCategories,
        savedActivityDays,
        savedCheckIn,
        savedFeatures,
      ] = await fromServer([
        tasks,
        lists,
        tags,
        prizes,
        days,
        redemptions,
        goals,
        settings,
        warmUps,
        nudges,
        categories,
        activityDays,
        checkIns,
        featureSwitches,
      ])
      const activityDaysRead = savedActivityDays.docs.map((saved) => ({ day: saved.id, entries: readActivityDay(saved.data()) }))
      const known: KnownRecords = {
        taskIds: ids(savedTasks),
        listIds: ids(savedLists),
        tagIds: ids(savedTags),
        tagNames: savedTags.docs.flatMap((saved) => readTag(saved.data())?.name ?? []),
        prizeIds: ids(savedPrizes),
        categoryIds: ids(savedCategories),
        activityIds: new Set(activityDaysRead.flatMap(({ entries }) => (entries ?? []).map((entry) => entry.id))),
        unreadableActivityDays: new Set(activityDaysRead.filter(({ entries }) => entries === null).map(({ day }) => day)),
        redemptionIds: ids(savedRedemptions),
        bonuses: bonusesIn(savedGoals),
        pointValue: pointValueIn(savedSettings),
        cases: casesIn(savedSettings),
        warmUp: warmUpIn(savedWarmUp),
        nudge: nudgeIn(savedNudge),
        checkIn: checkInIn(savedCheckIn),
        features: featuresIn(savedFeatures),
        days: new Map(
          savedDays.docs.map((saved): [LocalDay, ReadonlySet<TaskId> | null] => {
            const entries = readRewardDay(saved.data())
            return [saved.id, entries === null ? null : new Set(entries.map((entry) => entry.taskId))]
          }),
        ),
      }

      const { fresh, alreadyHere } = newRecords(incoming, known, now)
      const value = fresh.pointValue
      const cases = fresh.cases
      const warmUp = fresh.warmUp
      const nudge = fresh.nudge === null ? null : toStoredNudge(fresh.nudge)
      const checkIn = fresh.checkIn === null ? null : toStoredCheckIn(fresh.checkIn)
      const features = fresh.features === null ? null : toStoredFeatures(fresh.features)

      // A day is merged, never replaced, as when points are earned or time is
      // logged: only the entries it did not hold are added to it.
      await commitInBatches(firestore, [
        ...fresh.tasks.map((task) => (batch: WriteBatch) => batch.set(doc(tasks, task.id), toStoredTask(task))),
        ...fresh.lists.map((list) => (batch: WriteBatch) => batch.set(doc(lists, list.id), toStoredList(list))),
        ...fresh.tags.map((tag) => (batch: WriteBatch) => batch.set(doc(tags, tag.id), toStoredTag(tag))),
        ...fresh.prizes.map((prize) => (batch: WriteBatch) => batch.set(doc(prizes, prize.id), toStoredPrize(prize))),
        ...fresh.categories.map((category) => (batch: WriteBatch) =>
          batch.set(doc(categories, category.id), toStoredCategory(category)),
        ),
        ...toStoredRewardDays(fresh.entries).map((day) => (batch: WriteBatch) =>
          batch.set(doc(days, day.day), day, { merge: true }),
        ),
        ...toStoredActivityDays(fresh.activities).map((day) => (batch: WriteBatch) =>
          batch.set(doc(activityDays, day.day), day, { merge: true }),
        ),
        ...fresh.redemptions.map((redemption) => (batch: WriteBatch) =>
          batch.set(doc(redemptions, redemption.id), toStoredRedemption(redemption)),
        ),
        // The file's bonuses, point value, cases settings, warm-up, nudge, check-in and switches are
        // only ever set where the account has none of its own (`newRecords`).
        ...BONUS_PERIODS.flatMap((period) => {
          const points = fresh.bonuses[period]
          return points === null
            ? []
            : [(batch: WriteBatch) => batch.set(doc(goals, period), toStoredRewardGoal(period, points))]
        }),
        ...(value === null
          ? []
          : [(batch: WriteBatch) => batch.set(doc(settings, POINT_VALUE), toStoredPointValue(value))]),
        ...(cases === null
          ? []
          : [(batch: WriteBatch) => batch.set(doc(settings, CASES_SETTING), toStoredCaseSettings(cases))]),
        ...(warmUp === null
          ? []
          : [(batch: WriteBatch) => batch.set(doc(warmUps, WARM_UP), toStoredWarmUp(warmUp))]),
        ...(nudge === null ? [] : [(batch: WriteBatch) => batch.set(doc(nudges, NUDGE), nudge)]),
        ...(checkIn === null ? [] : [(batch: WriteBatch) => batch.set(doc(checkIns, CHECK_IN), checkIn)]),
        ...(features === null ? [] : [(batch: WriteBatch) => batch.set(doc(featureSwitches, FEATURES_RECORD), features)]),
      ])

      return { added: countRecords(fresh), alreadyHere }
    },
  }
}
