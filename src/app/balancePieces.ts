import { balanceShares, type BalanceTotals, type CategoryId } from '../core'
import { categoryColor, OTHER_COLOR, type BalanceColor } from './balanceColors'
import { OTHER_LABEL } from './balanceLabels'

/** What a piece of a Balance chart stands for: a category, or Other (BAL-5). */
export type PieceKey = CategoryId | 'other'

/** One piece of a Balance chart, as it is drawn and named (BAL-6). */
export interface BalancePiece {
  readonly key: PieceKey
  readonly label: string
  readonly seconds: number
  /** Whole percent of the total; the pieces' shares add up to 100. */
  readonly share: number
  readonly color: BalanceColor
}

/**
 * The pieces of a period or a day that have time in them: each category in the
 * order given — the order they were made — then Other. A category keeps the
 * colour of its place among all of them, so one with no time leaves the
 * others' colours as they were.
 */
export function balancePieces(totals: BalanceTotals): BalancePiece[] {
  const all = [
    ...totals.categories.map(({ category, seconds }, index) => ({
      key: category.id as PieceKey,
      label: category.name,
      seconds,
      color: categoryColor(index),
    })),
    { key: 'other' as PieceKey, label: OTHER_LABEL, seconds: totals.other, color: OTHER_COLOR },
  ].filter((piece) => piece.seconds > 0)

  const shares = balanceShares(
    all.map((piece) => piece.seconds),
    totals.total,
  )
  return all.map((piece, index) => ({ ...piece, share: shares[index] }))
}
