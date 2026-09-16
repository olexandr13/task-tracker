import type { Repeat, Weekday } from '../core'

/**
 * How recurrence rules read on screen. The rules themselves live in ../core;
 * wording is presentation, so it stays here.
 */

/** Sunday first, the way the calendar this app is modelled on lays a week out. */
export const WEEKDAYS: readonly { readonly value: Weekday; readonly initial: string; readonly name: string }[] = [
  { value: 0, initial: 'S', name: 'Sunday' },
  { value: 1, initial: 'M', name: 'Monday' },
  { value: 2, initial: 'T', name: 'Tuesday' },
  { value: 3, initial: 'W', name: 'Wednesday' },
  { value: 4, initial: 'T', name: 'Thursday' },
  { value: 5, initial: 'F', name: 'Friday' },
  { value: 6, initial: 'S', name: 'Saturday' },
]

const SHORT_NAMES: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

export function describeRepeat(repeat: Repeat): string {
  switch (repeat.kind) {
    case 'daily':
      return 'Daily'

    case 'weekly': {
      if (repeat.weekdays.length === 7) {
        return 'Daily'
      }
      const names = WEEKDAYS.filter((day) => repeat.weekdays.includes(day.value)).map(
        (day) => SHORT_NAMES[day.value],
      )
      return `Every ${names.join(', ')}`
    }

    case 'monthly':
      return `Every month on the ${ordinal(repeat.day)}`
  }
}

export function ordinal(day: number): string {
  // 11th, 12th and 13th break the pattern the other teens follow.
  const teen = day % 100
  if (teen >= 11 && teen <= 13) {
    return `${String(day)}th`
  }

  switch (day % 10) {
    case 1:
      return `${String(day)}st`
    case 2:
      return `${String(day)}nd`
    case 3:
      return `${String(day)}rd`
    default:
      return `${String(day)}th`
  }
}

/**
 * How long a completion holds, said in the period it holds for. A weekly rule on
 * every weekday is a daily rule under another name, the way `describeRepeat`
 * already reads it.
 */
export function describeDoneUntil(repeat: Repeat): string {
  switch (repeat.kind) {
    case 'daily':
      return 'done today'

    case 'weekly':
      return repeat.weekdays.length === 7 ? 'done today' : 'done this week'

    case 'monthly':
      return 'done this month'
  }
}
