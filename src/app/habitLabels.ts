import { startOfLocalDay, type HabitDayState, type HabitRate, type LocalDay } from '../core'

/**
 * How a habit's record reads on screen. The record itself is derived in
 * ../core; wording is presentation, so it stays here.
 */

export const HABIT_DAY_LABELS: Record<HabitDayState, string> = {
  done: 'Done',
  missed: 'Missed',
  pending: 'Not done yet',
  untracked: 'Not tracked',
  future: 'Still to come',
}

/** "1 day", "5 days". */
export function describeDays(count: number): string {
  return count === 1 ? '1 day' : `${String(count)} days`
}

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
