import { MAX_CATEGORIES, type BalanceTotals, type CategoryId } from '../core'
import { OTHER_LABEL } from './balanceLabels'
import { chartColor, OTHER_COLOR } from './chartColors'
import { chartPieces, type ChartPiece } from './chartPieces'

/** What a piece of a Balance chart stands for: a category, or Other (BAL-5). */
export type PieceKey = CategoryId | 'other'

/** One piece of a Balance chart, as it is drawn and named (BAL-6). */
export type BalancePiece = ChartPiece

/**
 * The pieces of a period or a day that have time in them: each category in the
 * order given — the order they were made — then Other. A category keeps the
 * colour of its place among all of them, so one with no time leaves the
 * others' colours as they were; there are never more categories than colours
 * (MAX_CATEGORIES), so none is ever reused.
 */
export function balancePieces(totals: BalanceTotals): BalancePiece[] {
  return chartPieces(
    [
      ...totals.categories.map(({ category, seconds }, index) => ({
        key: category.id,
        label: category.name,
        seconds,
        color: index < MAX_CATEGORIES ? chartColor(index) : OTHER_COLOR,
      })),
      { key: 'other', label: OTHER_LABEL, seconds: totals.other, color: OTHER_COLOR },
    ],
    totals.total,
  )
}
