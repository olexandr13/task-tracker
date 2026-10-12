import {
  REST_EVERY,
  REST_MAX,
  REST_START,
  startOfLocalDay,
  type HabitDayState,
  type HabitRate,
  type LocalDay,
  type RestStanding,
} from '../core'

/**
 * How a habit's record reads on screen. The record itself is derived in
 * ../core; wording is presentation, so it stays here.
 */

export const HABIT_DAY_LABELS: Record<HabitDayState, string> = {
  done: 'Done',
  skipped: 'Skipped',
  missed: 'Missed',
  pending: 'Not done yet',
  untracked: 'Not tracked',
  future: 'Still to come',
}

/** "1 day", "5 days". */
export function describeDays(count: number): string {
  return count === 1 ? '1 day' : `${String(count)} days`
}

/** "No rests", "1 rest", "2 rests": what a habit has to spend while rests are limited (HAB-39). */
export function describeRests(count: number): string {
  if (count === 0) return 'No rests'
  return count === 1 ? '1 rest' : `${String(count)} rests`
}

/**
 * The way to the next rest, beside the count on an open card (HAB-39): how many
 * days are still to be done in a row — or that it holds as many as it can.
 */
export function describeNextRest({ left, nextIn }: RestStanding): string {
  return left >= REST_MAX ? 'as many as it holds' : `next in ${describeDays(nextIn)}`
}

/** What a skip turned down for want of a rest says, where it was pressed (HAB-38). */
export function describeNoRest(nextIn: number): string {
  return `No rests left. This habit earns one for every ${String(REST_EVERY)} days in a row — ${String(nextIn)} more to go.`
}

/** The switch under Habits on Settings that limits rests (HAB-36). */
export const LIMIT_RESTS_LABEL = 'Limit rests'

/** What turning it on does, in one sentence under its name. */
export const LIMIT_RESTS_DESCRIPTION = `When on, "Skip" uses up one of the habit's rests: each habit starts with ${String(REST_START)}, earns 1 more for every ${String(REST_EVERY)} days done in a row, and holds up to ${String(REST_MAX)}.`

/** "84%", or a dash while there is nothing yet to rate. */
export function describeRate(rate: HabitRate): string {
  return rate.days === 0 ? '—' : `${String(rate.percent)}%`
}

/**
 * Built once, not per day: a grid is a year of them, and building a formatter
 * costs far more than using one.
 */
const dayFormat = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en', { month: 'short' })

/** What a day of the grid says when pointed at: "Wed, Sep 16 · Done". */
export function describeHabitDay(day: LocalDay, state: HabitDayState): string {
  return `${dayFormat.format(startOfLocalDay(day))} · ${HABIT_DAY_LABELS[state]}`
}

/** The month a week starts, for the week that holds its first Monday — the one a label goes over. */
export function monthStartedBy(monday: LocalDay): string | null {
  const date = startOfLocalDay(monday)
  return date.getDate() <= 7 ? monthFormat.format(date) : null
}
