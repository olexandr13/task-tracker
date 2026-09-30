import type { HabitDayState } from '../core'

/**
 * How each day of a habit is drawn, shared by its grid and the legend that
 * explains it. Done is the green a ticked box already is; a missed day is a
 * plain gap, darker than the days before the record started, and never red — a
 * miss is a fact to see, not an alarm to answer. A skipped day is drawn in the
 * same soft yellow as a rest's mark on the box that ticks today off (HAB-31),
 * so the two places agree on what a rest looks like, while staying paler than
 * done — a rest asked nothing of the habit (HAB-8), it just should not be read
 * as a miss or as a day before the record began.
 */
export const HABIT_DAY_TONES: Record<HabitDayState, string> = {
  done: 'bg-green-600 dark:bg-green-500',
  skipped: 'border border-yellow-400 bg-yellow-100 dark:border-yellow-500/70 dark:bg-yellow-900/40',
  missed: 'bg-neutral-300 dark:bg-neutral-700',
  pending: 'bg-white ring-1 ring-inset ring-neutral-400 dark:bg-neutral-900 dark:ring-neutral-500',
  untracked: 'bg-neutral-100 dark:bg-neutral-800/50',
  future: '',
}
