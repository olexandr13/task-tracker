import {
  MAX_ACTIVITY_NAME_LENGTH,
  entryTimes,
  offsetDay,
  startOfLocalDay,
  toLocalDay,
  toLocalTime,
  activityPeriodDays,
  type ActivityEntry,
  type ActivityPeriod,
  type DaysInFull,
  type LocalDay,
  type LoggedHours,
} from '../core'
import { describeHour } from './checkInLabels'
import { describeTimeOfDay } from './dueLabels'
import { describeSessionLength } from './durationLabels'

/**
 * How the activity log reads on screen (ACT-1). What the log adds up to is
 * worked out in ../core/activity; wording is presentation, so it stays here.
 */

export const ACTIVITY_HEADING = 'Activity log'

/** What the page is for and how it is used, in plain sentences, one thing each (UI-73). */
export const ACTIVITY_INTRO = [
  'Write down what you did, hour by hour, to see where your days go.',
  'Press an hour in the list to pick it. Then type what you did and how long it took, and press "Add".',
  'Type the time in minutes, like "15", or with hours, like "1h 20m".',
  'Press a record to change it, or its "×" to delete it. While changing it, press another hour to move it there.',
  'Time you log on a task, or with its timer, is added here too, under the task’s name and at the times it was spent. Taking that time back on the task deletes it here as well.',
  'To log an hour of today outside the hours set for Check-in, press "Show every hour so far" above the list.',
  'Switch between "Day", "Week" and "Month" to see the totals, and use "‹" and "›" beside the date to look back.',
  'Hours logged count the hours set for Check-in, from "From" to "To".',
]

export const PERIOD_CHOICES: readonly { readonly period: ActivityPeriod; readonly label: string }[] = [
  { period: 'day', label: 'Day' },
  { period: 'week', label: 'Week' },
  { period: 'month', label: 'Month' },
]

const dayFormat = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })
const shortDayFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })

/** The days of the period as a stretch: `Sep 21 – 27`, `Sep 28 – Oct 4`. */
function describeStretch(period: ActivityPeriod, anchor: LocalDay): string {
  const days = activityPeriodDays(period, anchor)
  const first = startOfLocalDay(days[0])
  const last = startOfLocalDay(days[days.length - 1])
  return first.getMonth() === last.getMonth()
    ? `${shortDayFormat.format(first)} – ${String(last.getDate())}`
    : `${shortDayFormat.format(first)} – ${shortDayFormat.format(last)}`
}

/** Whether `anchor` falls in the period under way at `now`. */
export function isCurrentPeriod(period: ActivityPeriod, anchor: LocalDay, now: Date): boolean {
  return activityPeriodDays(period, anchor).includes(toLocalDay(now))
}

/** What the period shown is called, between its ‹ and ›: `Today`, `Thu, Oct 1`, `This week`, `September 2026`. */
export function describePeriodTitle(period: ActivityPeriod, anchor: LocalDay, now: Date): string {
  const today = toLocalDay(now)
  switch (period) {
    case 'day':
      if (anchor === today) return 'Today'
      if (anchor === offsetDay(today, -1)) return 'Yesterday'
      return dayFormat.format(startOfLocalDay(anchor))
    case 'week':
      if (isCurrentPeriod('week', anchor, now)) return 'This week'
      if (isCurrentPeriod('week', offsetDay(anchor, 7), now)) return 'Last week'
      return describeStretch('week', anchor)
    case 'month':
      return isCurrentPeriod('month', anchor, now) ? 'This month' : monthFormat.format(startOfLocalDay(anchor))
  }
}

/** The period in a sentence, for a screen reader and for an empty chart: `today`, `on Thu, Oct 1`, `in the week of Sep 21 – 27`. */
export function describePeriodInSentence(period: ActivityPeriod, anchor: LocalDay, now: Date): string {
  const title = describePeriodTitle(period, anchor, now)
  switch (period) {
    case 'day':
      return title === 'Today' || title === 'Yesterday' ? title.toLowerCase() : `on ${title}`
    case 'week':
      return title === 'This week' || title === 'Last week' ? title.toLowerCase() : `in the week of ${title}`
    case 'month':
      return title === 'This month' ? 'this month' : `in ${title}`
  }
}

/** What the chart says with nothing logged in the period (ACT-13): `Nothing logged today.` */
export function describeNothingLogged(period: ActivityPeriod, anchor: LocalDay, now: Date): string {
  return `Nothing logged ${describePeriodInSentence(period, anchor, now)}.`
}

/**
 * How much of a day is logged (ACT-17): `9 of 10 hours logged so far`, `13 of
 * 13 hours logged`, or — before the first hour meant to be logged is over —
 * how many there are to log.
 */
export function describeLoggedHours({ ended, expected, logged }: LoggedHours): string {
  if (ended === 0) return `${String(expected)} ${expected === 1 ? 'hour' : 'hours'} to log today`
  const hours = ended === 1 ? 'hour' : 'hours'
  return ended < expected ? `${String(logged)} of ${String(ended)} ${hours} logged so far` : `${String(logged)} of ${String(ended)} ${hours} logged`
}

/** How many days of a week or a month were logged in full (ACT-18): `3 of 5 days logged in full`. */
export function describeDaysInFull({ inFull, counted }: DaysInFull): string {
  return `${String(inFull)} of ${String(counted)} ${counted === 1 ? 'day' : 'days'} logged in full`
}

/** A record as it is listed: `Work 45m`. */
export function describeEntry(entry: ActivityEntry): string {
  return `${entry.activity} ${describeSessionLength(entry.seconds)}`
}

/**
 * When a record was spent, by the clock (ACT-21): `11:00–11:30`, one time for
 * one under a minute, or null for a record that does not know.
 */
export function describeEntryTimes(entry: ActivityEntry): string | null {
  const times = entryTimes(entry)
  if (times === null) return null
  const start = describeTimeOfDay(toLocalTime(times.start))
  const end = describeTimeOfDay(toLocalTime(times.end))
  return start === end ? start : `${start}–${end}`
}

/** A record named for a screen reader, its times after it when it knows them: `“Work 30m”, 11:00–11:30`. */
export function describeEntryFully(entry: ActivityEntry): string {
  const times = describeEntryTimes(entry)
  return times === null ? `“${describeEntry(entry)}”` : `“${describeEntry(entry)}”, ${times}`
}

/** What the undo toast says of a record taken out (ACT-11): `Deleted “Work 45m” at 10:00`. */
export function describeEntryDeleted(entry: ActivityEntry): string {
  return `Deleted “${describeEntry(entry)}” at ${describeHour(entry.hour)}`
}

/** What changing a record says about moving it (ACT-10). */
export const MOVE_HINT = 'Press another hour to move it.'

/** What the button over today's hours says, to list every hour so far or only the hours to log again (ACT-20). */
export const EVERY_HOUR = { show: 'Show every hour so far', hide: 'Show only the hours to log' } as const

/** An hour with nothing logged under it, as its row says (ACT-7). */
export const NOT_LOGGED = 'not logged'

/** Why a record is not added: the refusals said under the boxes (ACT-3, ACT-6). */
export const ACTIVITY_REFUSALS = {
  noActivity: 'Type what you did first.',
  badActivity: `An activity can be at most ${String(MAX_ACTIVITY_NAME_LENGTH)} characters, on one line.`,
  noDuration: 'Type how long it took, like "15" or "1h 20m".',
  badDuration: 'That isn’t a length of time. Type minutes, like "15", or hours, like "1h 20m".',
  tooLong: 'One record can be at most 24 hours.',
  notStarted: 'That hour hasn’t started yet.',
} as const

export type ActivityRefusal = keyof typeof ACTIVITY_REFUSALS
