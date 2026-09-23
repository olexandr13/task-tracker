import { useCallback, useEffect, useState } from 'react'
import {
  createRedemption,
  NO_BONUSES,
  pointsBalance,
  type Period,
  type PointValue,
  type Redemption,
  type RedemptionId,
  type RewardEntry,
  type RewardKey,
} from '../core'
import type { PointsLedger, RewardRepository } from '../storage/rewardRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

const EMPTY: PointsLedger = { entries: [], redemptions: [], bonuses: NO_BONUSES, pointValue: null }

/**
 * Holds the points ledger on screen: what completions earned, what was
 * redeemed, what clearing each period is worth (RWD-24, RWD-29) and what a
 * point is worth in money (RWD-31). What completions earn is written as tasks
 * change (useTasks); this reads it back, redeems, sets the rules, and can take
 * an earning or a redemption off the ledger.
 *
 * Nothing is put on screen ahead of the repository: Firestore hands a write
 * made here straight back through the subscription, offline too, so the ledger
 * shown is always the one saved.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useRewards(repository: RewardRepository, onProblem: ReportProblem = ignoreProblems) {
  const [ledger, setLedger] = useState<PointsLedger>(EMPTY)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        setLedger(saved)
        setStatus('loaded')
      },
      (error) => {
        console.error('Could not load rewards.', error)
        setStatus('failed')
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const balance = pointsBalance(ledger.entries, ledger.redemptions)

  /** Sees a write through: a refusal is logged as `failed`, and said on screen. */
  const attempt = useCallback(
    (write: Promise<void>, failed: string) => {
      write.catch((error: unknown) => {
        console.error(failed, error)
        onProblem('save')
      })
    },
    [onProblem],
  )

  /**
   * Spends points on what the note says, and hands back what was spent so the
   * caller can say so and offer to undo it (RWD-41). Null when there was
   * nothing to spend it on, or not enough to spend: nothing can be redeemed
   * that has not been earned (RWD-16), and the button that asked is off in that
   * case, so this is the last guard rather than the first.
   */
  const redeem = useCallback(
    (points: number, note: string): Redemption | null => {
      let made: Redemption
      try {
        made = createRedemption(points, note, balance)
      } catch (error) {
        console.error('Could not redeem those points.', error)
        return null
      }

      attempt(repository.redeem(made), 'Could not save the redemption.')
      return made
    },
    [repository, balance, attempt],
  )

  /**
   * Deletes a redemption, giving its points back, and hands it back so the
   * caller can offer to undo. Null when there was nothing there to delete.
   */
  const removeRedemption = useCallback(
    (id: RedemptionId): Redemption | null => {
      const target = ledger.redemptions.find((redemption) => redemption.id === id)
      if (target === undefined) return null

      attempt(repository.removeRedemption(id), 'Could not delete the redemption.')
      return target
    },
    [repository, ledger.redemptions, attempt],
  )

  /** Puts a deleted redemption back, same id and day. */
  const restoreRedemption = useCallback(
    (redemption: Redemption) => {
      attempt(repository.redeem(redemption), 'Could not restore the redemption.')
    },
    [repository, attempt],
  )

  /**
   * Takes an earning off the ledger and hands it back so the caller can offer
   * to undo. Does not reopen the task: undoing the completion is how that is
   * done; this only corrects the points. Null when there was nothing to delete.
   */
  const removeEarning = useCallback(
    (key: RewardKey): RewardEntry | null => {
      const target = ledger.entries.find((entry) => entry.taskId === key.taskId && entry.day === key.day)
      if (target === undefined) return null

      attempt(repository.save({ earned: [], revoked: [key] }), 'Could not delete the earning.')
      return target
    },
    [repository, ledger.entries, attempt],
  )

  /**
   * Sets what clearing the period earns from here on, or takes its bonus away
   * with null. What earlier periods earned by it stays as it is, as changing a
   * task's reward leaves its earlier completions (RWD-3).
   */
  const setBonus = useCallback(
    (period: Period, points: number | null) => {
      attempt(repository.setBonus(period, points), 'Could not save the bonus.')
    },
    [repository, attempt],
  )

  /**
   * Sets what one point is worth in money, or forgets it with null. It counts
   * nothing: what it changes is only how the points are spelled out (RWD-32).
   */
  const setPointValue = useCallback(
    (value: PointValue | null) => {
      attempt(repository.setPointValue(value), 'Could not save what a point is worth.')
    },
    [repository, attempt],
  )

  /**
   * Writes what one completion earned, in place of whatever it earned before:
   * a deleted earning put back, or the win card's extra points (JUST-9).
   */
  const saveEarning = useCallback(
    (entry: RewardEntry) => {
      attempt(repository.save({ earned: [entry], revoked: [] }), 'Could not save the earning.')
    },
    [repository, attempt],
  )

  return {
    ...ledger,
    balance,
    isLoading: status === 'loading',
    /**
     * The repository refused to read the ledger: an empty one then is not an
     * empty account, and a balance of 0 would read as points lost (RWD-22).
     */
    loadFailed: status === 'failed',
    redeem,
    removeRedemption,
    restoreRedemption,
    removeEarning,
    saveEarning,
    setBonus,
    setPointValue,
  }
}
