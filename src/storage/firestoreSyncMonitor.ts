import { onSnapshot, type Firestore } from 'firebase/firestore'
import { ACCOUNT_COLLECTIONS, accountCollection, type AccountCollection } from './firestoreAccount'
import type { SyncMonitor } from './syncMonitor'

/**
 * Whether the account's changes have reached Firestore, read from what Firestore
 * itself says about each of the account's collections: a change is pending from
 * the moment it is made — offline, or queued from an earlier visit — until the
 * server has it. Watching a collection the repositories already watch costs no
 * extra reads; Firestore shares the one listener.
 *
 * A deletion is the one change this cannot see, the document being gone from
 * what is watched. It is sent with everything else all the same.
 *
 * Whether there is a connection is the browser's word for it.
 */
export function createFirestoreSyncMonitor(firestore: Firestore, accountId: string): SyncMonitor {
  return {
    subscribe(onState) {
      const pending = new Map<AccountCollection, boolean>()

      function emit() {
        onState({ online: navigator.onLine, pending: [...pending.values()].some(Boolean) })
      }

      const stops = ACCOUNT_COLLECTIONS.map((name) =>
        onSnapshot(
          accountCollection(firestore, accountId, name),
          { includeMetadataChanges: true },
          (snapshot) => {
            pending.set(name, snapshot.metadata.hasPendingWrites)
            emit()
          },
          // The repositories already report a collection that fails to load.
          () => {},
        ),
      )

      window.addEventListener('online', emit)
      window.addEventListener('offline', emit)
      emit()

      return () => {
        stops.forEach((stop) => { stop() })
        window.removeEventListener('online', emit)
        window.removeEventListener('offline', emit)
      }
    },
  }
}
