/**
 * Local calendar days: the unit a due date is written in.
 *
 * A due date is a day, not a moment. Stored as a timestamp it would slide to the
 * day before or after the moment the device crossed a time zone; stored as
 * ISO 8601's calendar date — `2026-09-16` — it stays the day it was set for,
 * wherever it is read. It also sorts as text in date order, which is what every
 * comparison here leans on.
 */

/** `YYYY-MM-DD`, in the owner's local calendar. */
export type LocalDay = string

export class InvalidDayError extends Error {
  constructor(value: string) {
    super(`Not a calendar day: "${value}". Expected YYYY-MM-DD.`)
    this.name = 'InvalidDayError'
  }
}

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** The local day a moment falls in. */
export function toLocalDay(moment: Date): LocalDay {
  const year = String(moment.getFullYear()).padStart(4, '0')
  const month = String(moment.getMonth() + 1).padStart(2, '0')
  const day = String(moment.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Whether the text names a day that exists — `2026-02-30` does not. */
export function isLocalDay(value: string): boolean {
  const match = PATTERN.exec(value)
  if (match === null) return false

  const [, year, month, day] = match.map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Local midnight at the start of the day. Throws on anything that is not a real day. */
export function startOfLocalDay(day: LocalDay): Date {
  if (!isLocalDay(day)) {
    throw new InvalidDayError(day)
  }

  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

/** The day `days` later — or earlier, for a negative count — across months and years. */
export function offsetDay(day: LocalDay, days: number): LocalDay {
  const start = startOfLocalDay(day)
  return toLocalDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + days))
}

/**
 * Whole days from one local day to the other — negative when `to` is the
 * earlier of the two. Counted from midnight to midnight and rounded, so a
 * clock going forward or back for summer time still leaves whole days between
 * whole days.
 */
export function daysBetween(from: LocalDay, to: LocalDay): number {
  const span = startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()
  return Math.round(span / 86_400_000)
}
