import { deleteDoc, doc, getDocFromServer, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import type { WarmUpRepository } from './warmUpRepository'
import { readWarmUp, toStoredWarmUp, WARM_UP } from './warmUpSchema'

/**
 * An account's warm-up in Firestore, beside its tasks and readable by that
 * account alone (`firestore.rules`): one document at
 * `users/{accountId}/warmUp/warmUp`, and no document at all is no warm-up.
 *
 * No document rather than a document saying none, as the period bonuses do
 * (`firestoreRewardRepository`): one shape for "there is none", whether there
 * never was one or it was ended. Like the tasks, it opens offline from the
 * browser's copy and a change waits for a connection.
 */
export function createFirestoreWarmUpRepository(firestore: Firestore, accountId: string): WarmUpRepository {
  const warmUps = accountCollection(firestore, accountId, 'warmUp')
  const only = doc(warmUps, WARM_UP)

  return {
    subscribe(onWarmUp, onError) {
      return onSnapshot(
        only,
        (saved) => {
          const read = saved.exists() ? readWarmUp(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved warm-up: unexpected shape.')
          onWarmUp(read)
        },
        onError,
      )
    },

    save(warmUp) {
      return warmUp === null ? deleteDoc(only) : setDoc(only, toStoredWarmUp(warmUp))
    },

    async importWarmUp(warmUp) {
      const existing = await getDocFromServer(only)
      if (existing.exists()) return
      await setDoc(only, toStoredWarmUp(warmUp))
    },
  }
}
