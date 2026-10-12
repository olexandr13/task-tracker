import { deleteDoc, doc, getDocFromServer, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import type { HabitSettingsRepository } from './habitSettingsRepository'
import { HABIT_RESTS, readHabitRests, toStoredHabitRests } from './habitSettingsSchema'

/**
 * An account's limit on rests in Firestore, readable by that account alone
 * (`firestore.rules`): one document at `users/{accountId}/habitSettings/rests`,
 * and no document at all is the limit off (STORE-63), as the feature switches
 * are kept.
 */
export function createFirestoreHabitSettingsRepository(firestore: Firestore, accountId: string): HabitSettingsRepository {
  const rests = doc(accountCollection(firestore, accountId, 'habitSettings'), HABIT_RESTS)

  return {
    subscribe(onRests, onError) {
      return onSnapshot(
        rests,
        (saved) => {
          const read = saved.exists() ? readHabitRests(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved limit on rests: unexpected shape.')
          onRests(read)
        },
        onError,
      )
    },

    save(limit) {
      const stored = toStoredHabitRests(limit)
      return stored === null ? deleteDoc(rests) : setDoc(rests, stored)
    },

    async importRests(limit) {
      const existing = await getDocFromServer(rests)
      if (existing.exists()) return
      await setDoc(rests, toStoredHabitRests(limit))
    },
  }
}
