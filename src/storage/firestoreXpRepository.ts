import {
  doc,
  FirestoreError,
  getDocFromServer,
  getDocs,
  increment,
  onSnapshot,
  runTransaction,
  setDoc,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore'
import { startXp } from '../core'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import type { XpRepository } from './xpRepository'
import {
  LEGACY_XP_START,
  migrateLegacyXp,
  readLegacyXpDay,
  readLegacyXpStart,
  readXpProgress,
  toStoredXpProgress,
  XP_PROGRESS,
} from './xpSchema'

/** Waits for a connection: offline, a transaction cannot run, and is tried again the next time. */
async function whenOnline(run: () => Promise<void>): Promise<void> {
  try {
    await run()
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'unavailable') return
    throw error
  }
}

/**
 * An account's XP in Firestore, readable by that account alone
 * (`firestore.rules`): one document, `users/{accountId}/levelSettings/progress`,
 * and no document at all is XP not begun (STORE-64).
 *
 * What a change gives is added with Firestore's own increment, so two devices
 * adding at once both count, offline too. Counting the days gone by and
 * beginning, and lifting it back to zero, are done in a transaction, so two
 * devices counting the same days count them once; offline they wait for the
 * next time.
 *
 * Version 1 kept a ledger a day at a time in `xpDays`, and the day XP began
 * under `start`. Beginning moves them in — the records added up — and lets go
 * of both (STORE-5).
 */
export function createFirestoreXpRepository(firestore: Firestore, accountId: string): XpRepository {
  const settings = accountCollection(firestore, accountId, 'levelSettings')
  const progress = doc(settings, XP_PROGRESS)
  const legacyStart = doc(settings, LEGACY_XP_START)
  const legacyDays = accountCollection(firestore, accountId, 'xpDays')

  return {
    subscribe(onProgress, onError) {
      return onSnapshot(
        progress,
        (saved) => {
          const read = saved.exists() ? readXpProgress(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring where the saved XP stands: unexpected shape.')
          onProgress(read)
        },
        onError,
      )
    },

    begin(day) {
      return whenOnline(async () => {
        const days = await getDocs(legacyDays)
        await runTransaction(firestore, async (transaction) => {
          if ((await transaction.get(progress)).exists()) return
          const legacy = await transaction.get(legacyStart)
          const start = legacy.exists() ? readLegacyXpStart(legacy.data()) : null
          const begun =
            start === null ? startXp(day) : migrateLegacyXp(start, days.docs.flatMap((saved) => readLegacyXpDay(saved.data())))
          transaction.set(progress, toStoredXpProgress(begun))
          if (legacy.exists()) transaction.delete(legacyStart)
        })
        if (days.docs.length > 0) {
          await commitInBatches(firestore, days.docs.map((saved) => (batch: WriteBatch) => batch.delete(saved.ref)))
        }
      })
    },

    add({ xp, adds }) {
      return setDoc(
        progress,
        { xp: increment(xp), ...(adds === null ? {} : { addsOn: adds.on, adds: adds.count }) },
        { merge: true },
      )
    },

    settle(count) {
      return whenOnline(() =>
        runTransaction(firestore, async (transaction) => {
          const saved = await transaction.get(progress)
          const stored = saved.exists() ? readXpProgress(saved.data()) : null
          if (stored === null) return
          const settled = count(stored)
          if (settled === null) return
          transaction.update(progress, { xp: stored.xp + settled.xp, settledThrough: settled.settledThrough })
        }),
      )
    },

    lift(least) {
      return whenOnline(() =>
        runTransaction(firestore, async (transaction) => {
          const saved = await transaction.get(progress)
          const stored = saved.exists() ? readXpProgress(saved.data()) : null
          if (stored === null || stored.xp >= least) return
          transaction.update(progress, { xp: least })
        }),
      )
    },

    async importProgress(given) {
      const existing = await getDocFromServer(progress)
      if (existing.exists()) return
      await setDoc(progress, toStoredXpProgress(given))
    },
  }
}
