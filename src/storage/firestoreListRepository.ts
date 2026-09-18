import { doc, onSnapshot, type Firestore, type WriteBatch } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import type { ListRepository } from './listRepository'
import { readList, toStoredList } from './listSchema'

/**
 * An account's lists in Firestore: one document per list, filed under the
 * account at `users/{accountId}/lists/{listId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Beside the tasks rather than holding them: a task names its list by id
 * (`../core/list`), so a list is renamed, made or deleted without a single task
 * being written. Like the tasks it opens offline from the browser's copy, and
 * when two devices change the same list the later write wins.
 */
export function createFirestoreListRepository(firestore: Firestore, accountId: string): ListRepository {
  const lists = accountCollection(firestore, accountId, 'lists')

  return {
    subscribe(onLists, onError) {
      return onSnapshot(
        lists,
        (snapshot) => {
          onLists(
            snapshot.docs.flatMap((saved) => {
              const read = readList(saved.data())
              if (read === null) console.warn(`Ignoring saved list ${saved.id}: unexpected shape.`)
              return read === null ? [] : [read]
            }),
          )
        },
        onError,
      )
    },

    save({ saved, removed }) {
      return commitInBatches(firestore, [
        ...saved.map((list) => (batch: WriteBatch) => batch.set(doc(lists, list.id), toStoredList(list))),
        ...removed.map((id) => (batch: WriteBatch) => batch.delete(doc(lists, id))),
      ])
    },
  }
}
