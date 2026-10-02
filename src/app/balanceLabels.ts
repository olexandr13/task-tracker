import {
  MAX_CATEGORIES,
  MAX_CATEGORY_NAME_LENGTH,
  startOfLocalDay,
  type DayBalance,
  type LocalDay,
  type Period,
} from '../core'
import type { BalancePiece } from './balancePieces'
import { describeDuration, describeSessionLength } from './durationLabels'

/**
 * How the Balance page reads (BAL-1). What the time comes to is worked out in
 * ../core/balance; wording is presentation, so it stays here.
 */

/** The heading over the whole page. */
export const BALANCE_HEADING = 'Work–rest balance'

/** What the page is for, and how time reaches it, in plain sentences. */
export const BALANCE_INTRO = [
  'See where your logged time went. Helps to keep work/rest balance.',
]

export const PERIOD_CHOICES: readonly { readonly period: Period; readonly label: string }[] = [
  { period: 'today', label: 'Today' },
  { period: 'week', label: 'Week' },
  { period: 'month', label: 'Month' },
]

/** What the totals say when nothing was logged in the period (BAL-6). */
export const NOTHING_LOGGED: Record<Period, string> = {
  today: 'No time logged today.',
  week: 'No time logged this week.',
  month: 'No time logged this month.',
}

/** The line for time on tasks bound to no category (BAL-5). */
export const OTHER_LABEL = 'Other'

export const NO_CATEGORIES_HINT = 'Add a category below to divide this time.'

export const CATEGORIES_HELP = [
  'Add categories like "Work", "Routine" or "Rest", bind tags to it. Add tags to tasks. Then log time on a task.',
]

export const CATEGORY_NAME_TAKEN = 'There is a category called that already.'

export const CATEGORY_NAME_EMPTY = 'Type a name for the category first.'

export const CATEGORY_NAME_TOO_LONG = `A category name can be at most ${String(MAX_CATEGORY_NAME_LENGTH)} characters, on one line.`

/** Why a ninth category is refused (BAL-7). */
export const CATEGORY_LIMIT = `You can have up to ${String(MAX_CATEGORIES)} categories, one for each colour on the chart.`

/** The heading over the day-by-day chart (BAL-13). */
export const BY_DAY_HEADING = 'By day'

/** What the line over the day-by-day chart says before a day is chosen (BAL-13). */
export const DAY_READOUT_HINT = 'Point at a day, or press it, to see how its time divided.'

/** What the period is called in a sentence: `today`, `this week`, `this month`. */
const PERIOD_IN_A_SENTENCE: Record<Period, string> = { today: 'today', week: 'this week', month: 'this month' }

const dayFormat = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })
const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'short' })

/** The days of a month labelled under its columns: a week apart, so the numbers never crowd. */
const LABELLED_MONTH_DAYS = new Set([1, 8, 15, 22, 29])

/** `Tue, Sep 15`. */
export function describeDay(day: LocalDay): string {
  return dayFormat.format(startOfLocalDay(day))
}

/** What stands under a day's column: `Mon` in a week; in a month the 1st, 8th, 15th… and nothing else. */
export function dayAxisLabel(day: LocalDay, period: Period): string {
  const date = startOfLocalDay(day)
  if (period === 'week') return weekdayFormat.format(date)
  return LABELLED_MONTH_DAYS.has(date.getDate()) ? String(date.getDate()) : ''
}

/** `1h 30m`, `<1m` for seconds that make no minute, `0m` for none (TIME-22). */
export function describeBalanceTime(seconds: number): string {
  return seconds === 0 ? describeDuration(0) : describeSessionLength(seconds)
}

/** `1h 30m · 60%`: the time and its share of the total (BAL-6). */
export function describeShare(seconds: number, percent: number): string {
  return `${describeBalanceTime(seconds)} · ${String(percent)}%`
}

/** What the bar says to a screen reader: `Time spent today, 6h 15m: Work 4h, 64%; Rest 45m, 12%` (BAL-6). */
export function describeBar(pieces: readonly BalancePiece[], total: number, period: Period): string {
  const parts = pieces.map((piece) => `${piece.label} ${describeBalanceTime(piece.seconds)}, ${String(piece.share)}%`)
  return `Time spent ${PERIOD_IN_A_SENTENCE[period]}, ${describeBalanceTime(total)}: ${parts.join('; ')}`
}

/** One day of the day-by-day chart: `Tue, Sep 15 · 6h 15m: Work 4h, Rest 45m`, or that nothing was logged (BAL-13). */
export function describeDayBalance(day: DayBalance, pieces: readonly BalancePiece[]): string {
  if (day.total === 0) return `${describeDay(day.day)}: nothing logged`
  const parts = pieces.map((piece) => `${piece.label} ${describeBalanceTime(piece.seconds)}`)
  return `${describeDay(day.day)} · ${describeBalanceTime(day.total)}: ${parts.join(', ')}`
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
