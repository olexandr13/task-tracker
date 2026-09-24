import { atLocalTime, offsetDay, startOfLocalDay, toLocalDay, type LocalDay, type LocalTime } from '../core'

/**
 * How a due date reads on screen. The days themselves live in ../core; wording
 * is presentation, so it stays here.
 */

/** What heads the run of tasks whose day has gone by. */
export const OVERDUE_LABEL = 'Overdue'

/** Relative where that is quicker to read — Today, Tomorrow, Yesterday — and a short date otherwise. */
export function describeDueDate(day: LocalDay, now: Date): string {
  const today = toLocalDay(now)
  if (day === today) return 'Today'
  if (day === offsetDay(today, 1)) return 'Tomorrow'
  if (day === offsetDay(today, -1)) return 'Yesterday'
  return describeShortDate(day, now)
}

/** A month and its year, as a calendar is headed: "September 2026". */
export function describeMonth(month: LocalDay): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(startOfLocalDay(month))
}

/** A day in full, as a screen reader hears a calendar's day: "Thursday, October 1, 2026". */
export function describeFullDate(day: LocalDay): string {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(
    startOfLocalDay(day),
  )
}

/** A short date — "Sep 20" — with the year only when it is not this one: "Sep 20" is plainly this September. */
export function describeShortDate(day: LocalDay, now: Date): string {
  const date = startOfLocalDay(day)
  return date.getFullYear() === now.getFullYear()
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

/** An hour as the clock reads it here — "9:00 AM" — with no day around it. */
export function describeTimeOfDay(time: LocalTime, now: Date): string {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(
    atLocalTime(toLocalDay(now), time),
  )
}

/**
 * A day with the hour it is due at, where it is due at one: "Today at 9:00 AM".
 * Without an hour it is the day alone, which is what most tasks have.
 */
export function describeDueAt(day: LocalDay, time: LocalTime | null, now: Date): string {
  const date = describeDueDate(day, now)
  return time === null ? date : `${date} at ${describeTimeOfDay(time, now)}`
}
