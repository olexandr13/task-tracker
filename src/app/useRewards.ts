import { useCallback, useEffect, useState } from 'react'
import { createRedemption, pointsBalance, type Redemption, type RedemptionId, type RewardEntry, type RewardKey } from '../core'
import type { PointsLedger, RewardRepository } from '../storage/rewardRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

const EMPTY: PointsLedger = { entries: [], redemptions: [], todayBonus: null }

/**
 * Holds the points ledger on screen: what completions earned, what was
 * redeemed, and what clearing Today is worth (RWD-24). What completions earn is
 * written as tasks change (useTasks); this reads it back, redeems, sets the
 * bonus, and can take an earning or a redemption off the ledger.
 *
 * Nothing is put on screen ahead of the repository: Firestore hands a write
 * made here straight back through the subscription, offline too, so the ledger
 * shown is always the one saved.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useRewards(repository: RewardRepository, onProblem: ReportProblem = ignoreProblems) {
  const [ledger, setLedger] = useState<PointsLedger>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        setLedger(saved)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load rewards.', error)
        setIsLoading(false)
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

  /** Spends points on what the note says. More than the balance is refused (see `createRedemption`). */
  const redeem = useCallback(
    (points: number, note: string) => {
      attempt(repository.redeem(createRedemption(points, note, balance)), 'Could not save the redemption.')
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
   * Sets what clearing Today earns from here on, or takes the bonus away with
   * null. What earlier days earned by it stays as it is, as changing a task's
   * reward leaves its earlier completions (RWD-3).
   */
  const setTodayBonus = useCallback(
    (points: number | null) => {
      attempt(repository.setTodayBonus(points), 'Could not save the Today bonus.')
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
    isLoading,
    redeem,
    removeRedemption,
    restoreRedemption,
    removeEarning,
    saveEarning,
    setTodayBonus,
  }
}
