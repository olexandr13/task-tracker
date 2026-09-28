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
 * The weeks a month is drawn in: from the one holding its 1st to the one holding
 * its last day — four to six — the days either side, on the first and the last
 * of them, belonging to the months around it. Never a week of another month's
 * days alone: the calendar is as tall as the month needs, and grows or shrinks
 * by a row as paging moves between months.
 */
export function calendarWeeks(month: LocalDay): LocalDay[][] {
  const first = monthOf(month)
  // The day before the next month's 1st: the month's last, whatever its length.
  const last = offsetDay(offsetMonth(first, 1), -1)
  const weeks: LocalDay[][] = []
  // A week is drawn while it opens on or before the last day, so the last one drawn holds it.
  for (let monday = startOfWeek(first); monday <= last; monday = offsetDay(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, weekday) => offsetDay(monday, weekday)))
  }
  return weeks
}
