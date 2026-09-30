import { deleteDoc, doc, getDocFromServer, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import type { NudgeRepository } from './nudgeRepository'
import { NUDGE, readNudge, toStoredNudge } from './nudgeSchema'

/**
 * An account's nudge setting in Firestore, beside its tasks and readable by
 * that account alone (`firestore.rules`): one document at
 * `users/{accountId}/nudge/nudge`, and no document at all is the nudge exactly
 * as the app arrives — off, at the default span, at any hour (STORE-46).
 *
 * No document rather than a document saying off, as the warm-up does
 * (`firestoreWarmUpRepository`): one shape for "nothing has been asked for",
 * whether it never was or was set back. Like the tasks, it opens offline from
 * the browser's copy and a change waits for a connection.
 */
export function createFirestoreNudgeRepository(firestore: Firestore, accountId: string): NudgeRepository {
  const nudges = accountCollection(firestore, accountId, 'nudge')
  const only = doc(nudges, NUDGE)

  return {
    subscribe(onPreference, onError) {
      return onSnapshot(
        only,
        (saved) => {
          const read = saved.exists() ? readNudge(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved nudge setting: unexpected shape.')
          onPreference(read)
        },
        onError,
      )
    },

    save(preference) {
      const stored = toStoredNudge(preference)
      return stored === null ? deleteDoc(only) : setDoc(only, stored)
    },

    async importNudge(preference) {
      const stored = toStoredNudge(preference)
      if (stored === null) return
      const existing = await getDocFromServer(only)
      if (existing.exists()) return
      await setDoc(only, stored)
    },
  }
}
