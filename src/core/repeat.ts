/**
 * Recurrence rules: what "this comes back" means.
 *
 * A repeat never stores dates of its own. It answers one question — given a
 * moment, which day is the occurrence currently in play? — and everything else
 * (is it done, is it still pending) follows from that answer and the task's
 * `completedAt`. Keeping it derived means nothing has to run at midnight to
 * roll tasks over: the next render already sees the new day.
 *
 * Days are local days on purpose. A personal tracker's "today" is the owner's
 * today, not UTC's.
 */

/** As `Date.getDay()` counts them: 0 is Sunday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Repeat =
  | { readonly kind: 'daily' }
  | { readonly kind: 'weekly'; readonly weekdays: readonly Weekday[] }
  /** `day` is a day of the month, 1-31, clamped to the last day of short months. */
  | { readonly kind: 'monthly'; readonly day: number }

export class InvalidRepeatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRepeatError'
  }
}

/** Throws unless the rule can actually produce occurrences. */
export function assertValidRepeat(repeat: Repeat): void {
  if (repeat.kind === 'weekly' && repeat.weekdays.length === 0) {
    throw new InvalidRepeatError('A weekly repeat needs at least one weekday.')
  }

  if (repeat.kind === 'monthly' && !isDayOfMonth(repeat.day)) {
    throw new InvalidRepeatError('A monthly repeat needs a day of the month between 1 and 31.')
  }
}

/**
 * Whether two rules say the same thing, null being "happens once". Weekly days
 * are a set, so the same days in another order are the same rule.
 */
export function sameRepeat(a: Repeat | null, b: Repeat | null): boolean {
  if (a === null || b === null) return a === b
  if (a.kind === 'daily') return b.kind === 'daily'
  if (a.kind === 'monthly') return b.kind === 'monthly' && a.day === b.day

  return (
    b.kind === 'weekly' &&
    a.weekdays.length === b.weekdays.length &&
    a.weekdays.every((weekday) => b.weekdays.includes(weekday))
  )
}

/**
 * Whether the rule comes round every single day: a daily rule, or a weekly one
 * that has all seven weekdays and so is a daily rule under another name.
 */
export function repeatsEveryDay(repeat: Repeat): boolean {
  return repeat.kind === 'daily' || (repeat.kind === 'weekly' && new Set(repeat.weekdays).size === 7)
}

function isDayOfMonth(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31
}

export function startOfDay(moment: Date): Date {
  return new Date(moment.getFullYear(), moment.getMonth(), moment.getDate())
}

/**
 * The start of the most recent day this rule was due, on or before `now`.
 *
 * This is the hinge the whole feature turns on: a repeating task counts as done
 * when it was completed at or after this moment, and is pending otherwise. When
 * the next occurrence arrives the boundary moves forward and the same stored
 * `completedAt` now sits behind it, so the task is todo again.
 */
export function currentOccurrence(repeat: Repeat, now: Date = new Date()): Date {
  const today = startOfDay(now)

  switch (repeat.kind) {
    case 'daily':
      return today

    case 'weekly': {
      // At most seven steps back reaches every weekday, so this always lands.
      for (let daysBack = 0; daysBack < 7; daysBack += 1) {
        const day = addDays(today, -daysBack)
        if (repeat.weekdays.includes(day.getDay() as Weekday)) {
          return day
        }
      }
      throw new InvalidRepeatError('A weekly repeat needs at least one weekday.')
    }

    case 'monthly': {
      const thisMonth = monthlyOccurrence(today.getFullYear(), today.getMonth(), repeat.day)
      return thisMonth <= today ? thisMonth : monthlyOccurrence(today.getFullYear(), today.getMonth() - 1, repeat.day)
    }
  }
}

/**
 * Whether a completion stamped at this moment still counts for the occurrence
 * currently in play — the comparison the previous paragraph describes, written
 * once because two records now ask it: a task about its own completion, and a
 * subtask about the completion of the task it hangs off.
 */
export function countsForCurrentOccurrence(completedAt: string, repeat: Repeat, now: Date): boolean {
  return new Date(completedAt) >= currentOccurrence(repeat, now)
}

/**
 * Whether the rule is due on a given local day.
 *
 * `currentOccurrence` answers "which occurrence is in play"; this answers "does
 * this day carry one at all", which is the question counting a period's tasks
 * asks of every day in it.
 */
export function occursOn(repeat: Repeat, day: Date): boolean {
  switch (repeat.kind) {
    case 'daily':
      return true

    case 'weekly':
      return repeat.weekdays.includes(day.getDay() as Weekday)

    case 'monthly':
      // Same year and month by construction, so the day of the month decides it.
      return monthlyOccurrence(day.getFullYear(), day.getMonth(), repeat.day).getDate() === day.getDate()
  }
}

/**
 * The start of the first day after `day` the rule falls on — where a skipped
 * occurrence hands the task on to (see `dueDay` in ./due).
 */
export function nextOccurrence(repeat: Repeat, day: Date): Date {
  // The widest gap any rule leaves is a monthly 31st's: Jan 31 to Feb 28 is 28
  // days, Feb 28 to Mar 31 is 31. Two months' worth always lands.
  for (let offset = 1; offset <= 62; offset += 1) {
    const next = addDays(startOfDay(day), offset)
    if (occursOn(repeat, next)) {
      return next
    }
  }
  throw new InvalidRepeatError('The rule never comes round.')
}

function addDays(day: Date, offset: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset)
}

/**
 * The occurrence in a given month. A month index of -1 rolls back to December of
 * the year before on its own, which is what makes the "previous month" case work.
 * The 31st of a 30-day month lands on the 30th rather than spilling into the next.
 */
function monthlyOccurrence(year: number, month: number, day: number): Date {
  const firstOfMonth = new Date(year, month, 1)
  const lastDay = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate()

  return new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), Math.min(day, lastDay))
}
