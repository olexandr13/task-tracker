import { deleteDoc, doc, onSnapshot, setDoc, type Firestore } from 'firebase/firestore'
import { accountCollection } from './firestoreAccount'
import type { ProcrastinationRepository } from './procrastinationRepository'
import { PROCRASTINATION, readProcrastination, toStoredProcrastination } from './procrastinationSchema'

/**
 * An account's Procrastination mode in Firestore, beside its tasks and readable
 * by that account alone (`firestore.rules`): one document at
 * `users/{accountId}/procrastination/procrastination`, and no document at all
 * is the mode off (STORE-45).
 *
 * No document rather than a document saying off, as the warm-up does
 * (`firestoreWarmUpRepository`): one shape for "there is none", whether it was
 * never on or was ended. Like the tasks, it opens offline from the browser's
 * copy and a change waits for a connection — so the mode survives a refresh in
 * a tunnel, which is where it is needed most.
 */
export function createFirestoreProcrastinationRepository(
  firestore: Firestore,
  accountId: string,
): ProcrastinationRepository {
  const modes = accountCollection(firestore, accountId, 'procrastination')
  const only = doc(modes, PROCRASTINATION)

  return {
    subscribe(onState, onError) {
      return onSnapshot(
        only,
        (saved) => {
          const read = saved.exists() ? readProcrastination(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved Procrastination mode: unexpected shape.')
          onState(read)
        },
        onError,
      )
    },

    save(state) {
      return state === null || state.phase === 'off'
        ? deleteDoc(only)
        : setDoc(only, toStoredProcrastination(state))
    },
  }
}
