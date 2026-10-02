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
import {
  DEFAULT_CHEST,
  NO_BONUSES,
  type ChestSettings,
  type PeriodBonuses,
  type PointValue,
  type Redemption,
  type RewardEntry,
} from '../core'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import type { RewardRepository } from './rewardRepository'
import {
  CHEST,
  POINT_VALUE,
  readChestSettings,
  readPointValue,
  readRedemption,
  readRewardDay,
  readRewardGoal,
  REWARD_SCHEMA_VERSION,
  toStoredChestSettings,
  toStoredPointValue,
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
 *   `users/{accountId}/rewardGoals/{period}` — Today, week and month (RWD-29) —
 *   and no document at all is no bonus;
 * - what a point is worth, at `users/{accountId}/rewardSettings/pointValue`,
 *   and no document at all is nothing set;
 * - what the chest asks of a day and what its key plays for, at
 *   `users/{accountId}/rewardSettings/chest`, and no document at all is what an
 *   account starts with (CHST-7).
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
  const settings = accountCollection(firestore, accountId, 'rewardSettings')
  const pointValue = doc(settings, POINT_VALUE)
  const chestSettings = doc(settings, CHEST)

  return {
    subscribe(onLedger, onError) {
      // Five watchers, one ledger: nothing is handed on until all of them are
      // known, so a balance is never drawn from part of it. The bonuses, the
      // point value and the chest's settings are held as boxes rather than
      // values, there being nothing set to tell from not knowing yet.
      let entries: RewardEntry[] | null = null
      let spent: Redemption[] | null = null
      let bonuses: { of: PeriodBonuses } | null = null
      let value: { of: PointValue | null } | null = null
      let chest: { of: ChestSettings } | null = null

      function emit() {
        if (entries !== null && spent !== null && bonuses !== null && value !== null && chest !== null) {
          onLedger({
            entries,
            redemptions: spent,
            bonuses: bonuses.of,
            pointValue: value.of,
            chest: chest.of,
          })
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
        goals,
        (snapshot) => {
          const read: Record<string, number | null> = { ...NO_BONUSES }
          for (const saved of snapshot.docs) {
            const goal = readRewardGoal(saved.data())
            if (goal === null) {
              console.warn(`Ignoring the saved bonus for ${saved.id}: unexpected shape.`)
              continue
            }
            read[goal.period] = goal.points
          }
          bonuses = { of: read as PeriodBonuses }
          emit()
        },
        onError,
      )

      const stopValue = onSnapshot(
        pointValue,
        (saved) => {
          const read = saved.exists() ? readPointValue(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved point value: unexpected shape.')
          value = { of: read }
          emit()
        },
        onError,
      )

      const stopChest = onSnapshot(
        chestSettings,
        (saved) => {
          const read = saved.exists() ? readChestSettings(saved.data()) : null
          if (saved.exists() && read === null) console.warn('Ignoring the saved chest settings: unexpected shape.')
          chest = { of: read ?? DEFAULT_CHEST }
          emit()
        },
        onError,
      )

      return () => {
        stopDays()
        stopRedemptions()
        stopGoals()
        stopValue()
        stopChest()
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

    setBonus(period, points) {
      // No bonus is no document, rather than a document saying none: one shape
      // for "nothing set", whether it was never set or was taken away.
      const goal = doc(goals, period)
      return points === null ? deleteDoc(goal) : setDoc(goal, toStoredRewardGoal(period, points))
    },

    setPointValue(value) {
      return value === null ? deleteDoc(pointValue) : setDoc(pointValue, toStoredPointValue(value))
    },

    setChestSettings(chest) {
      return setDoc(chestSettings, toStoredChestSettings(chest))
    },

    async importBonus(period, points) {
      const goal = doc(goals, period)
      const existing = await getDocFromServer(goal)
      if (existing.exists()) return
      await setDoc(goal, toStoredRewardGoal(period, points))
    },

    async importPointValue(value) {
      const existing = await getDocFromServer(pointValue)
      if (existing.exists()) return
      await setDoc(pointValue, toStoredPointValue(value))
    },

    async importChestSettings(chest) {
      const existing = await getDocFromServer(chestSettings)
      if (existing.exists()) return
      await setDoc(chestSettings, toStoredChestSettings(chest))
    },
  }
}
