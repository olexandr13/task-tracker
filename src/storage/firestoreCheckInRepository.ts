import { deleteDoc, doc, getDocFromServer, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import type { CheckInRepository } from './checkInRepository'
import { CHECK_IN, readCheckIn, toStoredCheckIn } from './checkInSchema'
import { accountCollection } from './firestoreAccount'

/**
 * An account's check-in setting in Firestore, readable by that account alone
 * (`firestore.rules`): one document at
 * `users/{accountId}/checkIn/checkIn`, and no document at all is the check-in as
 * the app arrives, off at 09:00–22:00 (STORE-52), as the nudge's is kept.
 */
export function createFirestoreCheckInRepository(firestore: Firestore, accountId: string): CheckInRepository {
  const only = doc(accountCollection(firestore, accountId, 'checkIn'), CHECK_IN)

  return {
    subscribe(onPreference, onError) {
      return onSnapshot(
        only,
        (saved) => {
          const read = saved.exists() ? readCheckIn(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved check-in setting: unexpected shape.')
          onPreference(read)
        },
        onError,
      )
    },

    save(preference) {
      const stored = toStoredCheckIn(preference)
      return stored === null ? deleteDoc(only) : setDoc(only, stored)
    },

    async importCheckIn(preference) {
      const stored = toStoredCheckIn(preference)
      if (stored === null) return
      const existing = await getDocFromServer(only)
      if (existing.exists()) return
      await setDoc(only, stored)
    },
  }
}
