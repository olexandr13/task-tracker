import { repeatsEveryDay, type Repeat, type Weekday } from '../core'

/**
 * How recurrence rules read on screen. The rules themselves live in ../core;
 * wording is presentation, so it stays here.
 */

/** Monday first, as the week runs everywhere else in the app (../core/progress). */
export const WEEKDAYS: readonly { readonly value: Weekday; readonly initial: string; readonly name: string }[] = [
  { value: 1, initial: 'M', name: 'Monday' },
  { value: 2, initial: 'T', name: 'Tuesday' },
  { value: 3, initial: 'W', name: 'Wednesday' },
  { value: 4, initial: 'T', name: 'Thursday' },
  { value: 5, initial: 'F', name: 'Friday' },
  { value: 6, initial: 'S', name: 'Saturday' },
  { value: 0, initial: 'S', name: 'Sunday' },
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

/**
 * Weeks common enough to have a name of their own, which says "every" by itself.
 * A name may cover more than one set of days: Sunday to Thursday is the working
 * week where the weekend falls on Friday and Saturday.
 */
const NAMED_WEEKS: readonly { readonly name: string; readonly days: readonly Weekday[] }[] = [
  { name: 'Workdays', days: [1, 2, 3, 4, 5] },
  { name: 'Workdays', days: [0, 1, 2, 3, 4] },
  { name: 'Weekends', days: [0, 6] },
]

/**
 * The rule in full, for a screen reader and a tooltip, where no icon is there to
 * say that the task repeats.
 */
export function describeRepeat(repeat: Repeat): string {
  const { words, saysEvery } = wordRule(repeat)
  return saysEvery ? words : `Every ${words}`
}

/**
 * The rule as it reads beside the repeat icon, which already says "every": "Mon, Wed",
 * "23rd". A bare ordinal is a day of the month.
 */
export function describeRepeatBriefly(repeat: Repeat): string {
  return wordRule(repeat).words
}

/** A rule's words, and whether they say "every" themselves, as "Daily" and "Weekends" do. */
function wordRule(repeat: Repeat): { words: string; saysEvery: boolean } {
  if (repeatsEveryDay(repeat)) {
    return { words: 'Daily', saysEvery: true }
  }

  switch (repeat.kind) {
    case 'daily':
      return { words: 'Daily', saysEvery: true }

    case 'weekly': {
      const days = new Set(repeat.weekdays)
      const named = NAMED_WEEKS.find((week) => week.days.length === days.size && week.days.every((day) => days.has(day)))
      if (named !== undefined) {
        return { words: named.name, saysEvery: true }
      }

      const names = WEEKDAYS.filter((day) => days.has(day.value)).map((day) => SHORT_NAMES[day.value])
      return { words: names.join(', '), saysEvery: false }
    }

    case 'monthly':
      return { words: ordinal(repeat.day), saysEvery: false }
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
