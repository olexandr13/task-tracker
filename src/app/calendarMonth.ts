import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from '../core'

/**
 * The days a month calendar lays out. A month is named by its first day —
 * `2026-09-01` — so it is a LocalDay like any other, and compares as one.
 *
 * Weeks run Monday to Sunday, as they do everywhere else (../core/progress).
 */

/** The first day of the month the day falls in. */
export function monthOf(day: LocalDay): LocalDay {
  return `${day.slice(0, 7)}-01`
}

/** The Monday that opens the day's week. */
export function startOfWeek(day: LocalDay): LocalDay {
  // getDay counts from Sunday; from Monday, it is the days since the last one.
  return offsetDay(day, -((startOfLocalDay(day).getDay() + 6) % 7))
}

/**
 * The same day `months` later — or earlier, for a negative count — kept inside
 * its month: Jan 31 a month on is Feb 28, not Mar 3.
 */
export function offsetMonth(day: LocalDay, months: number): LocalDay {
  const date = startOfLocalDay(day)
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return toLocalDay(new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last)))
}

/**
 * The weeks a month is drawn in, from the one holding its 1st, the days either
 * side belonging to the months around it. Always six, so paging from month to
 * month never changes the calendar's height.
 */
export function calendarWeeks(month: LocalDay): LocalDay[][] {
  const start = startOfWeek(monthOf(month))
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => offsetDay(start, week * 7 + weekday)),
  )
}
