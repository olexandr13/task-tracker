import type { Firestore } from 'firebase/firestore'
import type { Prize } from '../core'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'
import type { PrizeRepository } from './prizeRepository'
import { readPrize, toStoredPrize } from './prizeSchema'

const PRIZE: RecordKind<Prize> = { noun: 'prize', read: readPrize, write: toStoredPrize }

/**
 * An account's wishlist in Firestore: one document per prize, filed under the
 * account at `users/{accountId}/prizes/{prizeId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Beside the ledger rather than in it: redeeming a prize writes a redemption of
 * its own (`firestoreRewardRepository`), so a prize is renamed, repriced or
 * deleted without a single redemption being rewritten. Like the tasks it opens
 * offline from the browser's copy, and when two devices change the same prize
 * the later write wins.
 */
export function createFirestorePrizeRepository(firestore: Firestore, accountId: string): PrizeRepository {
  const prizes = accountCollection(firestore, accountId, 'prizes')

  return {
    subscribe: (onPrizes, onError) => subscribeToRecords(prizes, PRIZE, onPrizes, onError),
    save: (changes) => saveRecords(firestore, prizes, PRIZE, changes),
  }
}
