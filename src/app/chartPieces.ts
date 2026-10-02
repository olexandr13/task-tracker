import { balanceShares } from '../core'
import type { ChartColor } from './chartColors'

/** One piece of a chart of time spent, as it is drawn and named (BAL-6, ACT-13). */
export interface ChartPiece {
  /** What it stands for — a category, an activity, Other — the same in every chart drawn from one set. */
  readonly key: string
  readonly label: string
  readonly seconds: number
  /** Whole percent of the total; the pieces' shares add up to 100. */
  readonly share: number
  readonly color: ChartColor
}

/** What a chart is divided into, before its shares are worked out. */
export interface ChartPart {
  readonly key: string
  readonly label: string
  readonly seconds: number
  readonly color: ChartColor
}

/**
 * The parts with time in them, in the order given, each with its share of the
 * total — rounded so the shares add up to exactly 100 (`balanceShares`).
 */
export function chartPieces(parts: readonly ChartPart[], total: number): ChartPiece[] {
  const kept = parts.filter((part) => part.seconds > 0)
  const shares = balanceShares(
    kept.map((part) => part.seconds),
    total,
  )
  return kept.map((part, index) => ({ ...part, share: shares[index] }))
}

/** One day of a day-by-day chart: its total and its pieces (BAL-13, ACT-14). */
export interface DayColumn {
  readonly day: string
  readonly total: number
  readonly pieces: readonly ChartPiece[]
}
