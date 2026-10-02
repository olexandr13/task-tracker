import type { ActivityKind, ActivityTotals } from '../core'
import { chartColor, type ChartColor } from './chartColors'
import { chartPieces, type ChartPiece } from './chartPieces'

/**
 * The colour of each activity: its place in the order activities were first
 * logged (`activityKinds`), so an activity wears the same colour whatever
 * period or day is drawn (ACT-16).
 */
export function activityColors(kinds: readonly ActivityKind[]): Map<string, ChartColor> {
  return new Map(kinds.map((kind, index) => [kind.key, chartColor(index)]))
}

/** The pieces of a period or a day that have time in them, in the order activities were first logged (ACT-13). */
export function activityPieces(totals: ActivityTotals, colors: ReadonlyMap<string, ChartColor>): ChartPiece[] {
  return chartPieces(
    totals.activities.map(({ kind, seconds }) => ({
      key: kind.key,
      label: kind.name,
      seconds,
      color: colors.get(kind.key) ?? chartColor(0),
    })),
    totals.total,
  )
}
