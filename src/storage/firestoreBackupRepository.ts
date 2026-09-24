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
import { countRecords, NeedsConnectionError, newRecords, type BackupRepository, type KnownRecords } from './backupRepository'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import { readList, toStoredList } from './listSchema'
import { readPrize, toStoredPrize } from './prizeSchema'
import {
  POINT_VALUE,
  readPointValue,
  readRedemption,
  readRewardDay,
  readRewardGoal,
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

  /** The warm-up the account has, of the one document it is ever kept as. */
  const warmUpIn = (snapshot: QuerySnapshot) =>
    snapshot.docs.flatMap((saved) => (saved.id === WARM_UP ? (readWarmUp(saved.data()) ?? []) : []))[0] ?? null

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
      ] = await Promise.all(
        [tasks, lists, tags, prizes, days, redemptions, goals, settings, warmUps].map((collection) =>
          getDocs(collection),
        ),
      )
      const readAll = <T>(snapshot: QuerySnapshot, read: (data: unknown) => T | null): T[] =>
        snapshot.docs.flatMap((saved) => read(saved.data()) ?? [])

      return {
        tasks: readAll(savedTasks, readStoredTask),
        lists: readAll(savedLists, readList),
        tags: readAll(savedTags, readTag),
        prizes: readAll(savedPrizes, readPrize),
        entries: readAll(savedDays, readRewardDay).flat(),
        redemptions: readAll(savedRedemptions, readRedemption),
        bonuses: bonusesIn(savedGoals),
        pointValue: pointValueIn(savedSettings),
        warmUp: warmUpIn(savedWarmUp),
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
      ] = await fromServer([tasks, lists, tags, prizes, days, redemptions, goals, settings, warmUps])
      const known: KnownRecords = {
        taskIds: ids(savedTasks),
        listIds: ids(savedLists),
        tagIds: ids(savedTags),
        tagNames: savedTags.docs.flatMap((saved) => readTag(saved.data())?.name ?? []),
        prizeIds: ids(savedPrizes),
        redemptionIds: ids(savedRedemptions),
        bonuses: bonusesIn(savedGoals),
        pointValue: pointValueIn(savedSettings),
        warmUp: warmUpIn(savedWarmUp),
        days: new Map(
          savedDays.docs.map((saved): [LocalDay, ReadonlySet<TaskId> | null] => {
            const entries = readRewardDay(saved.data())
            return [saved.id, entries === null ? null : new Set(entries.map((entry) => entry.taskId))]
          }),
        ),
      }

      const { fresh, alreadyHere } = newRecords(incoming, known, now)
      const value = fresh.pointValue
      const warmUp = fresh.warmUp

      // A day is merged, never replaced, as when points are earned: only the
      // entries it did not hold are added to it.
      await commitInBatches(firestore, [
        ...fresh.tasks.map((task) => (batch: WriteBatch) => batch.set(doc(tasks, task.id), toStoredTask(task))),
        ...fresh.lists.map((list) => (batch: WriteBatch) => batch.set(doc(lists, list.id), toStoredList(list))),
        ...fresh.tags.map((tag) => (batch: WriteBatch) => batch.set(doc(tags, tag.id), toStoredTag(tag))),
        ...fresh.prizes.map((prize) => (batch: WriteBatch) => batch.set(doc(prizes, prize.id), toStoredPrize(prize))),
        ...toStoredRewardDays(fresh.entries).map((day) => (batch: WriteBatch) =>
          batch.set(doc(days, day.day), day, { merge: true }),
        ),
        ...fresh.redemptions.map((redemption) => (batch: WriteBatch) =>
          batch.set(doc(redemptions, redemption.id), toStoredRedemption(redemption)),
        ),
        // The file's bonuses, point value and warm-up are only ever set where
        // the account has none of its own (`newRecords`).
        ...BONUS_PERIODS.flatMap((period) => {
          const points = fresh.bonuses[period]
          return points === null
            ? []
            : [(batch: WriteBatch) => batch.set(doc(goals, period), toStoredRewardGoal(period, points))]
        }),
        ...(value === null
          ? []
          : [(batch: WriteBatch) => batch.set(doc(settings, POINT_VALUE), toStoredPointValue(value))]),
        ...(warmUp === null
          ? []
          : [(batch: WriteBatch) => batch.set(doc(warmUps, WARM_UP), toStoredWarmUp(warmUp))]),
      ])

      return { added: countRecords(fresh), alreadyHere }
    },
  }
}
