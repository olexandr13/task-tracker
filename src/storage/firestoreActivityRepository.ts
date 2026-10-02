import { deleteField, doc, onSnapshot, type Firestore, type WriteBatch } from 'firebase/firestore'
import type { ActivityEntry } from '../core'
import type { ActivityRepository } from './activityRepository'
import { ACTIVITY_SCHEMA_VERSION, readActivityDay, toStoredActivityFields } from './activitySchema'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'

/**
 * An account's activity log in Firestore, one document per day at
 * `users/{accountId}/activityDays/{day}`, a field per record logged that day,
 * readable by that account alone (`firestore.rules`).
 *
 * A day is only ever written field by field — merged, never replaced — so two
 * devices logging on one day keep both, as the points ledger does
 * (./firestoreRewardRepository). Like the tasks it opens offline from the
 * browser's copy, and changes wait for a connection.
 */
export function createFirestoreActivityRepository(firestore: Firestore, accountId: string): ActivityRepository {
  const days = accountCollection(firestore, accountId, 'activityDays')

  return {
    subscribe(onEntries, onError) {
      return onSnapshot(
        days,
        (snapshot) => {
          onEntries(
            snapshot.docs.flatMap((saved) => {
              const read = readActivityDay(saved.data())
              if (read === null) console.warn(`Ignoring the saved activity log for ${saved.id}: unexpected shape.`)
              return read ?? []
            }),
          )
        },
        onError,
      )
    },

    save({ saved, removed }) {
      // A merge that deletes a field, rather than an update: an update of a day
      // with no document would fail the whole batch it is in.
      const write = (entry: ActivityEntry, fields: unknown) => (batch: WriteBatch) =>
        batch.set(doc(days, entry.day), { version: ACTIVITY_SCHEMA_VERSION, day: entry.day, entries: { [entry.id]: fields } }, { merge: true })

      return commitInBatches(firestore, [
        ...removed.map((entry) => write(entry, deleteField())),
        ...saved.map((entry) => write(entry, toStoredActivityFields(entry))),
      ])
    },
  }
}
