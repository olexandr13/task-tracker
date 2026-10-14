import { MAX_CATEGORIES, MAX_CATEGORY_NAME_LENGTH, type LocalDay, type Period } from '../core'
import { describeDay } from './chartLabels'

/**
 * How the Balance page reads (BAL-1). What the time comes to is worked out in
 * ../core/balance; wording is presentation, so it stays here. How its charts
 * read is shared with the activity log's (./chartLabels).
 */

/** The heading over the whole page. */
export const BALANCE_HEADING = 'Work–rest balance'

/** What the page is for, and how time reaches it, in plain sentences. */
export const BALANCE_INTRO = [
  'See where your logged time went, and how many tasks you completed in each category. Helps to keep work/rest balance.',
  'Press a category under a chart to list what is behind it in that period: the time logged to it, or the tasks completed in it. Press it again to hide the list.',
]

/** The heading over the chart of time spent (BAL-6). */
export const TIME_HEADING = 'Time spent'

/** The heading over the chart of tasks completed (BAL-17). */
export const COMPLETIONS_HEADING = 'Tasks completed'

export const PERIOD_CHOICES: readonly { readonly period: Period; readonly label: string }[] = [
  { period: 'today', label: 'Today' },
  { period: 'week', label: 'Week' },
  { period: 'month', label: 'Month' },
]

/** What the totals say when nothing was logged in the period (BAL-6). */
export const NOTHING_LOGGED: Record<Period, string> = {
  today: 'No time logged today.',
  week: 'No time logged this week.',
  month: 'No time logged this month.',
}

/** What the tasks chart says when nothing was completed in the period (BAL-17). */
export const NOTHING_COMPLETED: Record<Period, string> = {
  today: 'No tasks completed today.',
  week: 'No tasks completed this week.',
  month: 'No tasks completed this month.',
}

/** The line for time on tasks bound to no category (BAL-5). */
export const OTHER_LABEL = 'Other'

export const NO_CATEGORIES_HINT = 'Add a category below to divide this time.'

export const CATEGORIES_HELP = [
  'Add categories like "Work", "Routine" or "Rest", bind tags to them. Add tags to tasks. Then log time on a task.',
  'Time that was not a task can be logged to a category straight away: press "Log time" on it, say how long, and add a comment if you like.',
]

/** The button on a category that logs time straight to it (BAL-14). */
export const CATEGORY_TIME_BUTTON = 'Log time'

/** What the panel logging time to a category is called, and its button to a screen reader (BAL-14). */
export function describeCategoryTimeTitle(name: string): string {
  return `Log time to ${name}`
}

/** What the comment box on a category's panel says it is for when pointed at (BAL-14). */
export const CATEGORY_TIME_COMMENT_HINT = 'Saved with the next time you log here.'

/** The name over the sessions logged straight to a category (BAL-15). */
export const CATEGORY_TIME_LIST = 'Logged here'

/** The heading over the sessions behind the piece pressed in the legend (BAL-16): `Time logged to Rest this week`. */
export function describeSessionsHeading(label: string, when: string): string {
  return `Time logged to ${label} ${when}`
}

/** What a session logged straight to a category is called in that list, for want of a task (BAL-16). */
export const STRAIGHT_SESSION = `Logged with "${CATEGORY_TIME_BUTTON}"`

/** What something divided between categories was split with: `split with Work and Chores`. */
function describeSplitWith(names: readonly string[]): string {
  const listed = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `split with ${listed}`
}

/** A session divided between categories, said beside when it was logged (BAL-16): `30m split with Work and Chores`. */
export function describeSharedSession(length: string, names: readonly string[]): string {
  return `${length} ${describeSplitWith(names)}`
}

/** The heading over the tasks behind the piece pressed in the tasks legend (BAL-19): `Tasks completed in Rest this week`. */
export function describeCompletionsHeading(label: string, when: string): string {
  return `Tasks completed in ${label} ${when}`
}

/** When a task was completed, in the list behind a piece (BAL-19): `Today`, or `Tue, Sep 15`. */
export function describeCompletedOn(day: LocalDay, today: LocalDay): string {
  return day === today ? 'Today' : describeDay(day)
}

/** A completion divided between categories, said beside its day (BAL-19): `Today · split with Rest`. */
export function describeSharedCompletion(on: string, names: readonly string[]): string {
  return `${on} · ${describeSplitWith(names)}`
}

export const CATEGORY_NAME_TAKEN = 'There is a category called that already.'

export const CATEGORY_NAME_EMPTY = 'Type a name for the category first.'

export const CATEGORY_NAME_TOO_LONG = `A category name can be at most ${String(MAX_CATEGORY_NAME_LENGTH)} characters, on one line.`

/** Why a ninth category is refused (BAL-7). */
export const CATEGORY_LIMIT = `You can have up to ${String(MAX_CATEGORIES)} categories, one for each colour on the chart.`

/** What the period is called in a sentence: `today`, `this week`, `this month`. */
export const PERIOD_IN_A_SENTENCE: Record<Period, string> = { today: 'today', week: 'this week', month: 'this month' }
