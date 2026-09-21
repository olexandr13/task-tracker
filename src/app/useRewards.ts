import { useCallback, useEffect, useState } from 'react'
import { createRedemption, pointsBalance, type Redemption, type RedemptionId, type RewardEntry, type RewardKey } from '../core'
import type { PointsLedger, RewardRepository } from '../storage/rewardRepository'

const EMPTY: PointsLedger = { entries: [], redemptions: [] }

/**
 * Holds the points ledger on screen: what completions earned and what was
 * redeemed. What completions earn is written as tasks change (useTasks); this
 * reads it back, redeems, and can take an earning or a redemption off the ledger.
 *
 * Nothing is put on screen ahead of the repository: Firestore hands a write
 * made here straight back through the subscription, offline too, so the ledger
 * shown is always the one saved.
 */
export function useRewards(repository: RewardRepository) {
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
      },
    )
  }, [repository])

  const balance = pointsBalance(ledger.entries, ledger.redemptions)

  /** Spends points on what the note says. More than the balance is refused (see `createRedemption`). */
  const redeem = useCallback(
    (points: number, note: string) => {
      repository.redeem(createRedemption(points, note, balance)).catch((error: unknown) => {
        console.error('Could not save the redemption.', error)
      })
    },
    [repository, balance],
  )

  /**
   * Deletes a redemption, giving its points back, and hands it back so the
   * caller can offer to undo. Null when there was nothing there to delete.
   */
  const removeRedemption = useCallback(
    (id: RedemptionId): Redemption | null => {
      const target = ledger.redemptions.find((redemption) => redemption.id === id)
      if (target === undefined) return null

      repository.removeRedemption(id).catch((error: unknown) => {
        console.error('Could not delete the redemption.', error)
      })
      return target
    },
    [repository, ledger.redemptions],
  )

  /** Puts a deleted redemption back, same id and day. */
  const restoreRedemption = useCallback(
    (redemption: Redemption) => {
      repository.redeem(redemption).catch((error: unknown) => {
        console.error('Could not restore the redemption.', error)
      })
    },
    [repository],
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

      repository.save({ earned: [], revoked: [key] }).catch((error: unknown) => {
        console.error('Could not delete the earning.', error)
      })
      return target
    },
    [repository, ledger.entries],
  )

  /** Puts a deleted earning back on the ledger. */
  const restoreEarning = useCallback(
    (entry: RewardEntry) => {
      repository.save({ earned: [entry], revoked: [] }).catch((error: unknown) => {
        console.error('Could not restore the earning.', error)
      })
    },
    [repository],
  )

  return {
    ...ledger,
    balance,
    isLoading,
    redeem,
    removeRedemption,
    restoreRedemption,
    removeEarning,
    restoreEarning,
  }
}
