import type { HabitDayState } from '../core'

/**
 * How each day of a habit is drawn, shared by its grid and the legend that
 * explains it. Done is the green a ticked box already is; a missed day is a
 * plain gap, darker than the days before the record started, and never red — a
 * miss is a fact to see, not an alarm to answer. A skipped day is drawn palest
 * of all: a rest asked nothing of the habit (HAB-8), so it leaves the day blank
 * rather than carrying a colour, which keeps a year of squares quiet. It is
 * outlined rather than filled, which is what tells it from the two flat squares
 * it would otherwise be lost between — the darker gap of a miss and the equally
 * pale day before the record began. The colour a rest has of its own belongs on
 * the box that ticks today off, where the skip's mark can be drawn in it
 * (HAB-31); a square this small has no room for a mark.
 */
export const HABIT_DAY_TONES: Record<HabitDayState, string> = {
  done: 'bg-green-600 dark:bg-green-500',
  skipped: 'border border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800/50',
  missed: 'bg-neutral-300 dark:bg-neutral-700',
  pending: 'bg-white ring-1 ring-inset ring-neutral-400 dark:bg-neutral-900 dark:ring-neutral-500',
  untracked: 'bg-neutral-100 dark:bg-neutral-800/50',
  future: '',
}
