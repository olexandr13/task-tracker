import { startOfLocalDay, type LocalDay } from '../core'
import type { ChartPiece, DayColumn } from './chartPieces'
import { describeDuration, describeSessionLength } from './durationLabels'

/**
 * How the charts read — the Balance page's of time spent and of tasks
 * completed (BAL-6, BAL-13, BAL-17, BAL-18), and the activity log's (ACT-13,
 * ACT-14). What the amounts come to is worked out in ../core; wording is
 * presentation, so it stays here.
 */

/** The heading over the day-by-day chart (BAL-13). */
export const BY_DAY_HEADING = 'By day'

/**
 * What a chart counts, and how its amounts read. The charts are drawn the same
 * way whatever they count; only the words, and the round numbers the day-by-day
 * chart stands against, change.
 */
export interface ChartMeasure {
  /** What the bar is, as a screen reader hears it first: `Time spent`. */
  readonly name: string
  /** An amount as the legend and the day readout write it: `1h 30m`, `3`. */
  readonly describe: (amount: number) => string
  /** The total, large over the bar: `2h 30m`, `5 tasks`. */
  readonly describeTotal: (amount: number) => string
  /** What a day with nothing in it says: `nothing logged`. */
  readonly nothing: string
  /** What the line over the day-by-day chart says before a day is chosen. */
  readonly hint: string
  /** The top of the day-by-day chart: a round amount the busiest day fits under. */
  readonly ceiling: (busiest: number) => number
  /** A gridline's label: `6h`, `4`. */
  readonly describeGridline: (amount: number) => string
}

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
export function describeSplit(pieces: readonly ChartPiece[], total: number, when: string, measure: ChartMeasure): string {
  const parts = pieces.map((piece) => `${piece.label} ${measure.describe(piece.amount)}, ${String(piece.share)}%`)
  return `${measure.name} ${when}, ${measure.describeTotal(total)}: ${parts.join('; ')}`
}

/** One day of the day-by-day chart: `Tue, Sep 15 · 6h 15m: Work 4h, Rest 45m`, or that nothing was logged (BAL-13). */
export function describeDayColumn(column: DayColumn, measure: ChartMeasure): string {
  if (column.total === 0) return `${describeDay(column.day)}: ${measure.nothing}`
  const parts = column.pieces.map((piece) => `${piece.label} ${measure.describe(piece.amount)}`)
  return `${describeDay(column.day)} · ${measure.describeTotal(column.total)}: ${parts.join(', ')}`
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

/** Time spent, in seconds (BAL-6, BAL-13, ACT-13, ACT-14). */
export const TIME_MEASURE: ChartMeasure = {
  name: 'Time spent',
  describe: describeChartTime,
  describeTotal: describeChartTime,
  nothing: 'nothing logged',
  hint: 'Point at a day, or press it, to see how its time divided.',
  ceiling: chartCeiling,
  describeGridline,
}

/**
 * A number of tasks: whole as `3`; a share of one split between categories
 * (BAL-17) to a tenth, `1.5`, `0.3`.
 */
export function describeCount(amount: number): string {
  return String(Math.round(amount * 10) / 10)
}

/** `1 task`, `5 tasks`. */
export function describeTasks(amount: number): string {
  return `${describeCount(amount)} ${amount === 1 ? 'task' : 'tasks'}`
}

/** The counts the day-by-day chart of tasks reaches up to; each halves to a whole number for the middle gridline. */
const CEILING_COUNTS = [2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 60, 80, 100]

/** The top of the day-by-day chart of tasks: a round, even count the busiest day fits under (BAL-18). */
export function countCeiling(busiest: number): number {
  return CEILING_COUNTS.find((candidate) => candidate >= busiest) ?? Math.ceil(busiest / 20) * 20
}

/** Tasks completed, one each (BAL-17, BAL-18). */
export const TASKS_MEASURE: ChartMeasure = {
  name: 'Tasks completed',
  describe: describeCount,
  describeTotal: describeTasks,
  nothing: 'nothing completed',
  hint: 'Point at a day, or press it, to see how its tasks divided.',
  ceiling: countCeiling,
  describeGridline: describeCount,
}
