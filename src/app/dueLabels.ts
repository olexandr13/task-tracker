import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from '../core'

/**
 * How a due date reads on screen. The days themselves live in ../core; wording
 * is presentation, so it stays here.
 */

/** Relative where that is quicker to read — Today, Tomorrow, Yesterday — and a short date otherwise. */
export function describeDueDate(day: LocalDay, now: Date): string {
  const today = toLocalDay(now)
  if (day === today) return 'Today'
  if (day === offsetDay(today, 1)) return 'Tomorrow'
  if (day === offsetDay(today, -1)) return 'Yesterday'

  const date = startOfLocalDay(day)
  // The year only when it is not this one: "Sep 20" is plainly this September.
  return date.getFullYear() === now.getFullYear()
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

/** The day spelled out beside a quick choice, so "Next week" says which day that is. */
export function describeWeekday(day: LocalDay): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(
    startOfLocalDay(day),
  )
}
