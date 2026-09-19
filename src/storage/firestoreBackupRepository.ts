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
import type { LocalDay, TaskId } from '../core'
import { countRecords, NeedsConnectionError, newRecords, type BackupRepository, type KnownRecords } from './backupRepository'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import { readList, toStoredList } from './listSchema'
import { readRedemption, readRewardDay, toStoredRedemption, toStoredRewardDays } from './rewardSchema'
import { readStoredTask, toStoredTask } from './taskSchema'

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
  const days = accountCollection(firestore, accountId, 'rewardDays')
  const redemptions = accountCollection(firestore, accountId, 'redemptions')

  return {
    // The server when there is a connection, the browser's copy when there is not.
    async exportAll() {
      const [savedTasks, savedLists, savedDays, savedRedemptions] = await Promise.all(
        [tasks, lists, days, redemptions].map((collection) => getDocs(collection)),
      )
      const readAll = <T>(snapshot: QuerySnapshot, read: (data: unknown) => T | null): T[] =>
        snapshot.docs.flatMap((saved) => read(saved.data()) ?? [])

      return {
        tasks: readAll(savedTasks, readStoredTask),
        lists: readAll(savedLists, readList),
        entries: readAll(savedDays, readRewardDay).flat(),
        redemptions: readAll(savedRedemptions, readRedemption),
      }
    },

    async importAll(incoming, now) {
      const [savedTasks, savedLists, savedDays, savedRedemptions] = await fromServer([tasks, lists, days, redemptions])
      const known: KnownRecords = {
        taskIds: ids(savedTasks),
        listIds: ids(savedLists),
        redemptionIds: ids(savedRedemptions),
        days: new Map(
          savedDays.docs.map((saved): [LocalDay, ReadonlySet<TaskId> | null] => {
            const entries = readRewardDay(saved.data())
            return [saved.id, entries === null ? null : new Set(entries.map((entry) => entry.taskId))]
          }),
        ),
      }

      const { fresh, alreadyHere } = newRecords(incoming, known, now)

      // A day is merged, never replaced, as when points are earned: only the
      // entries it did not hold are added to it.
      await commitInBatches(firestore, [
        ...fresh.tasks.map((task) => (batch: WriteBatch) => batch.set(doc(tasks, task.id), toStoredTask(task))),
        ...fresh.lists.map((list) => (batch: WriteBatch) => batch.set(doc(lists, list.id), toStoredList(list))),
        ...toStoredRewardDays(fresh.entries).map((day) => (batch: WriteBatch) =>
          batch.set(doc(days, day.day), day, { merge: true }),
        ),
        ...fresh.redemptions.map((redemption) => (batch: WriteBatch) =>
          batch.set(doc(redemptions, redemption.id), toStoredRedemption(redemption)),
        ),
      ])

      return { added: countRecords(fresh), alreadyHere }
    },
  }
}
