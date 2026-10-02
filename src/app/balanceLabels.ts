import { MAX_CATEGORIES, MAX_CATEGORY_NAME_LENGTH, type Period } from '../core'

/**
 * How the Balance page reads (BAL-1). What the time comes to is worked out in
 * ../core/balance; wording is presentation, so it stays here. How its charts
 * read is shared with the activity log's (./chartLabels).
 */

/** The heading over the whole page. */
export const BALANCE_HEADING = 'Work–rest balance'

/** What the page is for, and how time reaches it, in plain sentences. */
export const BALANCE_INTRO = [
  'See where your logged time went. Helps to keep work/rest balance.',
]

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

/** The line for time on tasks bound to no category (BAL-5). */
export const OTHER_LABEL = 'Other'

export const NO_CATEGORIES_HINT = 'Add a category below to divide this time.'

export const CATEGORIES_HELP = [
  'Add categories like "Work", "Routine" or "Rest", bind tags to them. Add tags to tasks. Then log time on a task.',
]

export const CATEGORY_NAME_TAKEN = 'There is a category called that already.'

export const CATEGORY_NAME_EMPTY = 'Type a name for the category first.'

export const CATEGORY_NAME_TOO_LONG = `A category name can be at most ${String(MAX_CATEGORY_NAME_LENGTH)} characters, on one line.`

/** Why a ninth category is refused (BAL-7). */
export const CATEGORY_LIMIT = `You can have up to ${String(MAX_CATEGORIES)} categories, one for each colour on the chart.`

/** What the period is called in a sentence: `today`, `this week`, `this month`. */
export const PERIOD_IN_A_SENTENCE: Record<Period, string> = { today: 'today', week: 'this week', month: 'this month' }
