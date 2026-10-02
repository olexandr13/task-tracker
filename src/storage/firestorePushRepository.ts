import type { FirebaseApp } from 'firebase/app'
import { deleteDoc, doc, setDoc, type Firestore } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import type { PushRepository } from './pushRepository'
import { toStoredPushRegistration } from './pushSchema'

/** Where the sender's functions run: beside the database, in Europe (`functions/`). */
export const FUNCTIONS_REGION = 'europe-west1'

/**
 * An account's push registrations in Firestore, one document per device at
 * `users/{accountId}/pushSubscriptions/{deviceId}`, readable by that account
 * alone (`firestore.rules`) and by the sender, which runs with the project's
 * own rights and adds the hour it last pushed about.
 *
 * A registration is merged rather than replaced, so a device saying where it is
 * leaves what the sender wrote beside it.
 */
export function createFirestorePushRepository(firestore: Firestore, app: FirebaseApp, accountId: string): PushRepository {
  const registrations = accountCollection(firestore, accountId, 'pushSubscriptions')

  return {
    available: true,

    register(registration) {
      return setDoc(doc(registrations, registration.deviceId), toStoredPushRegistration(registration, new Date()), {
        merge: true,
      })
    },

    forget(deviceId) {
      return deleteDoc(doc(registrations, deviceId))
    },

    async sendTest(deviceId) {
      // Loaded when a test is asked for, not with the app: nothing else calls a function.
      const { getFunctions, httpsCallable } = await import('firebase/functions')
      await httpsCallable(getFunctions(app, FUNCTIONS_REGION), 'sendTestCheckIn')({ deviceId })
    },
  }
}
