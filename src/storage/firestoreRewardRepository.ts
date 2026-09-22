import {
  deleteDoc,
  deleteField,
  doc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore'
import type { Redemption, RewardEntry } from '../core'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import type { RewardRepository } from './rewardRepository'
import {
  readRedemption,
  readRewardDay,
  readRewardGoal,
  REWARD_SCHEMA_VERSION,
  TODAY_GOAL,
  toStoredRedemption,
  toStoredRewardGoal,
} from './rewardSchema'

/**
 * An account's points in Firestore, beside its tasks and readable by that
 * account alone (`firestore.rules`):
 *
 * - what completions earned, one document per day at
 *   `users/{accountId}/rewardDays/{day}`, a field per task done that day;
 * - what was redeemed, one document per redemption at
 *   `users/{accountId}/redemptions/{redemptionId}`;
 * - what clearing a period earns, one document per period at
 *   `users/{accountId}/rewardGoals/{period}` — Today's is all there is so far
 *   (RWD-24), and no document at all is no bonus.
 *
 * A day is only ever written field by field — merged, never replaced — so two
 * devices completing different tasks on one day keep both, and the same
 * completion written twice is written once. Like the tasks, it opens offline
 * from the browser's copy and changes wait for a connection.
 */
export function createFirestoreRewardRepository(firestore: Firestore, accountId: string): RewardRepository {
  const days = accountCollection(firestore, accountId, 'rewardDays')
  const redemptions = accountCollection(firestore, accountId, 'redemptions')
  const goals = accountCollection(firestore, accountId, 'rewardGoals')
  const todayGoal = doc(goals, TODAY_GOAL)

  return {
    subscribe(onLedger, onError) {
      // Three collections, one ledger: nothing is handed on until all of them
      // are known, so a balance is never drawn from part of it. The bonus is
      // held as a box rather than a number, there being no bonus to tell from
      // not knowing yet.
      let entries: RewardEntry[] | null = null
      let spent: Redemption[] | null = null
      let bonus: { points: number | null } | null = null

      function emit() {
        if (entries !== null && spent !== null && bonus !== null) {
          onLedger({ entries, redemptions: spent, todayBonus: bonus.points })
        }
      }

      const stopDays = onSnapshot(
        days,
        (snapshot) => {
          entries = snapshot.docs.flatMap((saved) => {
            const read = readRewardDay(saved.data())
            if (read === null) console.warn(`Ignoring saved rewards for ${saved.id}: unexpected shape.`)
            return read ?? []
          })
          emit()
        },
        onError,
      )

      const stopRedemptions = onSnapshot(
        redemptions,
        (snapshot) => {
          spent = snapshot.docs.flatMap((saved) => {
            const read = readRedemption(saved.data())
            if (read === null) console.warn(`Ignoring saved redemption ${saved.id}: unexpected shape.`)
            return read === null ? [] : [read]
          })
          emit()
        },
        onError,
      )

      const stopGoals = onSnapshot(
        todayGoal,
        (saved) => {
          const read = saved.exists() ? readRewardGoal(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved Today bonus: unexpected shape.')
          bonus = { points: read?.points ?? null }
          emit()
        },
        onError,
      )

      return () => {
        stopDays()
        stopRedemptions()
        stopGoals()
      }
    },

    save({ earned, revoked }) {
      // A merge that deletes a field, rather than an update: an update of a day
      // with no record would fail the whole batch it is in.
      return commitInBatches(firestore, [
        ...earned.map(({ taskId, day, points }) => (batch: WriteBatch) =>
          batch.set(doc(days, day), { version: REWARD_SCHEMA_VERSION, day, entries: { [taskId]: { points } } }, { merge: true }),
        ),
        ...revoked.map(({ taskId, day }) => (batch: WriteBatch) =>
          batch.set(doc(days, day), { version: REWARD_SCHEMA_VERSION, day, entries: { [taskId]: deleteField() } }, { merge: true }),
        ),
      ])
    },

    redeem(redemption) {
      return setDoc(doc(redemptions, redemption.id), toStoredRedemption(redemption))
    },

    removeRedemption(id) {
      return deleteDoc(doc(redemptions, id))
    },

    setTodayBonus(points) {
      // No bonus is no document, rather than a document saying none: one shape
      // for "nothing set", whether it was never set or was taken away.
      return points === null ? deleteDoc(todayGoal) : setDoc(todayGoal, toStoredRewardGoal(TODAY_GOAL, points))
    },

    async importTodayBonus(points) {
      const existing = await getDocFromServer(todayGoal)
      if (existing.exists()) return
      await setDoc(todayGoal, toStoredRewardGoal(TODAY_GOAL, points))
    },
  }
}
