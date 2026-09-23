import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createPrize,
  isPrizeNameTaken,
  markBought,
  putBack,
  renamePrize,
  repricePrize,
  sortPrizes,
  type Prize,
  type PrizeId,
  type PrizeKind,
} from '../core'
import type { PrizeChanges, PrizeRepository } from '../storage/prizeRepository'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: PrizeRepository, changes: PrizeChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save the wishlist.', error)
    onProblem('save')
  })
}

/**
 * Holds the prizes and the wishlist on screen and keeps them and the repository
 * in step both ways, as useLists does for the lists: a change made here is
 * saved, and one saved elsewhere — another tab, another device — comes back
 * through the subscription. The rules themselves live in ../core/prize; this
 * only wires them to React.
 *
 * Spending the points is not in here: that is the ledger's business
 * (useRewards). What is in here is what spending them does to the record — a
 * prize is left to come round again, a wish is marked bought (RWD-36, RWD-40).
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function usePrizes(repository: PrizeRepository, onProblem: ReportProblem = ignoreProblems) {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The prizes as the last change left them, so changes made in one go build on
  // each other rather than on the ones last drawn (STORE-39).
  const latest = useRef<Prize[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = sortPrizes(saved)
        setPrizes(latest.current)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load the wishlist.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: Prize[]) => Prize[]) => {
      const before = latest.current
      const next = sortPrizes(change(before))
      latest.current = next
      setPrizes(next)
      persist(repository, changesBetween(before, next), onProblem)
    },
    [repository, onProblem],
  )

  /**
   * Puts a prize or a wish on its list. False when the name will not do — one
   * another of either has already — which the page that asked says out loud
   * rather than making a second Chocolate.
   */
  const add = useCallback(
    (name: string, points: number, kind: PrizeKind): boolean => {
      if (isPrizeNameTaken(latest.current, name)) return false

      const made = createPrize(name, points, kind)
      apply((current) => [...current, made])
      return true
    },
    [apply],
  )

  /** Renames a prize, unless another prize is called that already. Says whether it happened. */
  const rename = useCallback(
    (id: PrizeId, name: string): boolean => {
      if (isPrizeNameTaken(latest.current, name, id)) return false

      apply((current) => current.map((prize) => (prize.id === id ? renamePrize(prize, name) : prize)))
      return true
    },
    [apply],
  )

  /** Changes what a prize costs. What it was already redeemed for keeps the price it was redeemed at. */
  const reprice = useCallback(
    (id: PrizeId, points: number) => {
      apply((current) => current.map((prize) => (prize.id === id ? repricePrize(prize, points) : prize)))
    },
    [apply],
  )

  /**
   * Takes a prize or a wish off its list. What it has already been redeemed for
   * stays in the history: what was spent is not rewritten (RWD-17).
   */
  const remove = useCallback(
    (id: PrizeId) => {
      apply((current) => current.filter((prize) => prize.id !== id))
    },
    [apply],
  )

  /**
   * Marks a wish bought, which takes it off what the points can buy (RWD-40).
   * A prize is left as it is: redeeming one leaves it to come round again.
   */
  const buy = useCallback(
    (id: PrizeId) => {
      apply((current) => current.map((prize) => (prize.id === id ? markBought(prize) : prize)))
    },
    [apply],
  )

  /** Puts a bought wish back, for undoing the redemption that bought it (RWD-41). */
  const restore = useCallback(
    (id: PrizeId) => {
      apply((current) => current.map((prize) => (prize.id === id ? putBack(prize) : prize)))
    },
    [apply],
  )

  return { prizes, isLoading, add, rename, reprice, remove, buy, restore }
}
