import { deleteField, doc, getDocsFromCache, onSnapshot, type Firestore, type WriteBatch } from 'firebase/firestore'
import type { JournalEntry } from '../core'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import type { JournalRepository } from './journalRepository'
import { JOURNAL_SCHEMA_VERSION, readJournalDay, toStoredJournalFields } from './journalSchema'

/**
 * An account's journal in Firestore, one document per day at
 * `users/{accountId}/journalDays/{day}`, a field per line written about that
 * day, readable by that account alone (`firestore.rules`).
 *
 * A day is only ever written field by field — merged, never replaced — so two
 * devices writing about one day keep both, as the activity log does
 * (./firestoreActivityRepository). A day the journal no longer keeps is deleted
 * whole (JRN-8), so the collection never holds more than a week or so of
 * documents. Like the tasks it opens offline from the browser's copy, and
 * changes wait for a connection.
 */
export function createFirestoreJournalRepository(firestore: Firestore, accountId: string): JournalRepository {
  const days = accountCollection(firestore, accountId, 'journalDays')

  return {
    subscribe(onEntries, onError) {
      return onSnapshot(
        days,
        (snapshot) => {
          onEntries(
            snapshot.docs.flatMap((saved) => {
              const read = readJournalDay(saved.data())
              if (read === null) console.warn(`Ignoring the saved journal for ${saved.id}: unexpected shape.`)
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
      const write = (entry: JournalEntry, fields: unknown) => (batch: WriteBatch) =>
        batch.set(doc(days, entry.day), { version: JOURNAL_SCHEMA_VERSION, day: entry.day, entries: { [entry.id]: fields } }, { merge: true })

      return commitInBatches(firestore, [
        ...removed.map((entry) => write(entry, deleteField())),
        ...saved.map((entry) => write(entry, toStoredJournalFields(entry))),
      ])
    },

    async forgetBefore(day) {
      // Filed under their days, which sort as text in date order — a day that
      // cannot be read included, being a day all the same. Asked of the copy
      // the subscription keeps, every day being in it, so it never waits on a
      // connection; the deletes wait for one like any change.
      const held = await getDocsFromCache(days)
      const old = held.docs.filter((saved) => saved.id < day)
      if (old.length === 0) return
      await commitInBatches(
        firestore,
        old.map((saved) => (batch: WriteBatch) => batch.delete(saved.ref)),
      )
    },
  }
}
