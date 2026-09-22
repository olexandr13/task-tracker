import type { Firestore } from 'firebase/firestore'
import type { Tag } from '../core'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'
import type { TagRepository } from './tagRepository'
import { readTag, toStoredTag } from './tagSchema'

const TAG: RecordKind<Tag> = { noun: 'tag', read: readTag, write: toStoredTag }

/**
 * An account's kept tags in Firestore: one document per tag, filed under the
 * account at `users/{accountId}/tags/{tagId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Beside the tasks rather than holding them: a task carries its tags by name
 * (`../core/tag`), so a tag is kept or made without a single task being written.
 * Like the tasks it opens offline from the browser's copy.
 */
export function createFirestoreTagRepository(firestore: Firestore, accountId: string): TagRepository {
  const tags = accountCollection(firestore, accountId, 'tags')

  return {
    subscribe: (onTags, onError) => subscribeToRecords(tags, TAG, onTags, onError),
    save: (changes) => saveRecords(firestore, tags, TAG, changes),
  }
}
