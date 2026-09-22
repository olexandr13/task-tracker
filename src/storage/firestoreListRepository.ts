import type { Firestore } from 'firebase/firestore'
import type { List } from '../core'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'
import type { ListRepository } from './listRepository'
import { readList, toStoredList } from './listSchema'

const LIST: RecordKind<List> = { noun: 'list', read: readList, write: toStoredList }

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
    subscribe: (onLists, onError) => subscribeToRecords(lists, LIST, onLists, onError),
    save: (changes) => saveRecords(firestore, lists, LIST, changes),
  }
}
