import { deleteDoc, doc, getDocFromServer, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import type { FeatureRepository } from './featureRepository'
import { FEATURES_RECORD, readFeatures, toStoredFeatures } from './featureSchema'
import { accountCollection } from './firestoreAccount'

/**
 * An account's switches on Settings in Firestore, readable by that account
 * alone (`firestore.rules`): one document at
 * `users/{accountId}/features/features`, and no document at all is everything
 * on (STORE-56), as the nudge's setting is kept.
 */
export function createFirestoreFeatureRepository(firestore: Firestore, accountId: string): FeatureRepository {
  const only = doc(accountCollection(firestore, accountId, 'features'), FEATURES_RECORD)

  return {
    subscribe(onFeatures, onError) {
      return onSnapshot(
        only,
        (saved) => {
          const read = saved.exists() ? readFeatures(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved feature switches: unexpected shape.')
          onFeatures(read)
        },
        onError,
      )
    },

    save(off) {
      const stored = toStoredFeatures(off)
      return stored === null ? deleteDoc(only) : setDoc(only, stored)
    },

    async importFeatures(off) {
      const stored = toStoredFeatures(off)
      if (stored === null) return
      const existing = await getDocFromServer(only)
      if (existing.exists()) return
      await setDoc(only, stored)
    },
  }
}
