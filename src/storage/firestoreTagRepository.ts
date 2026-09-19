import { doc, onSnapshot, type Firestore, type WriteBatch } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import type { TagRepository } from './tagRepository'
import { readTag, toStoredTag } from './tagSchema'

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
    subscribe(onTags, onError) {
      return onSnapshot(
        tags,
        (snapshot) => {
          onTags(
            snapshot.docs.flatMap((saved) => {
              const read = readTag(saved.data())
              if (read === null) console.warn(`Ignoring saved tag ${saved.id}: unexpected shape.`)
              return read === null ? [] : [read]
            }),
          )
        },
        onError,
      )
    },

    save({ saved, removed }) {
      return commitInBatches(firestore, [
        ...saved.map((tag) => (batch: WriteBatch) => batch.set(doc(tags, tag.id), toStoredTag(tag))),
        ...removed.map((id) => (batch: WriteBatch) => batch.delete(doc(tags, id))),
      ])
    },
  }
}
