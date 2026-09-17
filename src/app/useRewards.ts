import { useCallback, useEffect, useState } from 'react'
import { createRedemption, pointsBalance, type RedemptionId } from '../core'
import type { PointsLedger, RewardRepository } from '../storage/rewardRepository'

const EMPTY: PointsLedger = { entries: [], redemptions: [] }

/**
 * Holds the points ledger on screen: what completions earned and what was
 * redeemed. What completions earn is written as tasks change (useTasks); this
 * reads it back, and redeems.
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

  /** Deletes a redemption, giving its points back. */
  const removeRedemption = useCallback(
    (id: RedemptionId) => {
      repository.removeRedemption(id).catch((error: unknown) => {
        console.error('Could not delete the redemption.', error)
      })
    },
    [repository],
  )

  return { ...ledger, balance, isLoading, redeem, removeRedemption }
}
