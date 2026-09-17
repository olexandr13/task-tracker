import type { HabitDayState } from '../core'

/**
 * How each day of a habit is drawn, shared by its grid and the legend that
 * explains it. Done is the green a ticked box already is; a missed day is a
 * plain gap, darker than the days before the record started, and never red — a
 * miss is a fact to see, not an alarm to answer.
 */
export const HABIT_DAY_TONES: Record<HabitDayState, string> = {
  done: 'bg-green-600 dark:bg-green-500',
  missed: 'bg-neutral-300 dark:bg-neutral-700',
  pending: 'bg-white ring-1 ring-inset ring-neutral-400 dark:bg-neutral-900 dark:ring-neutral-500',
  untracked: 'bg-neutral-100 dark:bg-neutral-800/50',
  future: '',
}
