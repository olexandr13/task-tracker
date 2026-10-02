import { startOfLocalDay, type LocalDay } from '../core'
import type { ChartPiece, DayColumn } from './chartPieces'
import { describeDuration, describeSessionLength } from './durationLabels'

/**
 * How the charts of time spent read — the Balance page's (BAL-6, BAL-13) and
 * the activity log's (ACT-13, ACT-14). What the time comes to is worked out in
 * ../core; wording is presentation, so it stays here.
 */

/** The heading over the day-by-day chart (BAL-13). */
export const BY_DAY_HEADING = 'By day'

/** What the line over the day-by-day chart says before a day is chosen (BAL-13). */
export const DAY_READOUT_HINT = 'Point at a day, or press it, to see how its time divided.'

const dayFormat = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })
const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'short' })

/** The days of a month labelled under its columns: a week apart, so the numbers never crowd. */
const LABELLED_MONTH_DAYS = new Set([1, 8, 15, 22, 29])

/** `Tue, Sep 15`. */
export function describeDay(day: LocalDay): string {
  return dayFormat.format(startOfLocalDay(day))
}

/** What stands under a day's column: `Mon` in a week; in a month the 1st, 8th, 15th… and nothing else. */
export function dayAxisLabel(day: LocalDay, period: 'week' | 'month'): string {
  const date = startOfLocalDay(day)
  if (period === 'week') return weekdayFormat.format(date)
  return LABELLED_MONTH_DAYS.has(date.getDate()) ? String(date.getDate()) : ''
}

/** `1h 30m`, `<1m` for seconds that make no minute, `0m` for none (TIME-22). */
export function describeChartTime(seconds: number): string {
  return seconds === 0 ? describeDuration(0) : describeSessionLength(seconds)
}

/**
 * What a bar says to a screen reader: `Time spent today, 6h 15m: Work 4h, 64%;
 * Rest 45m, 12%` (BAL-6). `when` is the period in a sentence: `today`, `this
 * week`, `on Thu, Oct 1`.
 */
export function describeSplit(pieces: readonly ChartPiece[], total: number, when: string): string {
  const parts = pieces.map((piece) => `${piece.label} ${describeChartTime(piece.seconds)}, ${String(piece.share)}%`)
  return `Time spent ${when}, ${describeChartTime(total)}: ${parts.join('; ')}`
}

/** One day of the day-by-day chart: `Tue, Sep 15 · 6h 15m: Work 4h, Rest 45m`, or that nothing was logged (BAL-13). */
export function describeDayColumn(column: DayColumn): string {
  if (column.total === 0) return `${describeDay(column.day)}: nothing logged`
  const parts = column.pieces.map((piece) => `${piece.label} ${describeChartTime(piece.seconds)}`)
  return `${describeDay(column.day)} · ${describeChartTime(column.total)}: ${parts.join(', ')}`
}

/** The hours the day-by-day chart reaches up to: the first of these at or above the busiest day. */
const CEILING_HOURS = [1, 2, 3, 4, 6, 8, 12, 16, 24]

/** The top of the day-by-day chart, in seconds: a round number of hours the busiest day fits under (BAL-13). */
export function chartCeiling(busiest: number): number {
  const hours = CEILING_HOURS.find((candidate) => candidate * 3600 >= busiest) ?? CEILING_HOURS[CEILING_HOURS.length - 1]
  return hours * 3600
}

/** A gridline's label: `6h`, `3h`, `30m`. */
export function describeGridline(seconds: number): string {
  return describeDuration(Math.round(seconds / 60))
}
