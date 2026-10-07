/**
 * How much of a period has been cleared.
 *
 * Three periods are counted — today, this week (Monday to Sunday) and this
 * month — and each one asks the same two questions of every task: does it
 * belong to this period, and was it completed inside it.
 *
 * The unit is the **task**, not the occurrence. A task carries a single
 * `completedAt`, so "done at some point this week" is exactly what the stored
 * data can answer; "done on five of this week's seven days" is not. A daily
 * task therefore counts once towards the week, not seven times. Counting
 * occurrences needs a completion history, which is a step of its own.
 */

import { toLocalDay, type LocalDay } from './day'
import { isInPeriod } from './due'
import { occursOn, startOfDay, type Repeat } from './repeat'
import { isComplete, isDeleted, type Task } from './task'

export type Period = 'today' | 'week' | 'month'

/** Half-open: `start` is included, `end` is not. Both are local midnights. */
export interface PeriodRange {
  readonly start: Date
  readonly end: Date
}

export interface Progress {
  readonly completed: number
  /** Everything that belongs to the period, done or not. */
  readonly total: number
  /** How many are still to do before the period reads 100%. */
  readonly remaining: number
  /** 0-100, rounded down so that 100 only ever means everything is done. */
  readonly percent: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function periodRange(period: Period, now: Date = new Date()): PeriodRange {
  const today = startOfDay(now)

  switch (period) {
    case 'today':
      return { start: today, end: dayAfter(today, 1) }

    case 'week': {
      const start = startOfWeek(today)
      return { start, end: dayAfter(start, 7) }
    }

    case 'month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      }
  }
}

/** Weeks run Monday to Sunday, whatever `Date.getDay()` thinks the week starts on. */
function startOfWeek(day: Date): Date {
  const daysSinceMonday = (day.getDay() + 6) % 7
  return dayAfter(day, -daysSinceMonday)
}

function dayAfter(day: Date, offset: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset)
}

export function summarize(tasks: readonly Task[], period: Period, now: Date = new Date()): Progress {
  const range = periodRange(period, now)

  let completed = 0
  let total = 0

  for (const task of tasks) {
    // A task on its way to being gone belongs to no period. Checked here rather
    // than left to callers, so the trash can never inflate a period's count.
    if (isDeleted(task)) {
      continue
    }

    const done = completedWithin(task, range)
    // A task that was completed inside the period always counts towards it,
    // even where the occurrence it was ticked off for fell just outside — that
    // keeps `completed` from ever running past `total`.
    if (!done && !inPlayDuring(task, period, range, now)) {
      continue
    }

    total += 1
    if (done) {
      completed += 1
    }
  }

  return {
    completed,
    total,
    remaining: total - completed,
    percent: total === 0 ? 0 : Math.floor((completed / total) * 100),
  }
}

function completedWithin(task: Task, range: PeriodRange): boolean {
  if (task.completedAt === null) {
    return false
  }

  const at = new Date(task.completedAt)
  return at >= range.start && at < range.end
}

/**
 * Whether the period asks for the task. An occurrence of its rule inside the
 * period does, done or not, so a Friday task is part of the week from Monday.
 *
 * Otherwise a task still to do is counted wherever its list shows it
 * (`isInPeriod`) — a bar counts what its list shows. A task belongs from its
 * day on: to the period the day falls in, and to every later one it is still
 * undone in, so letting it slip does not take it out of the count — a one-off
 * past its date, or a weekly task missed on Monday, which Tuesday's list shows
 * under Overdue (LIST-2). One with no day at all can be done on any of the
 * period's days, so it belongs to all three (LIST-5).
 */
function inPlayDuring(task: Task, period: Period, range: PeriodRange, now: Date): boolean {
  if (task.repeat !== null && occursWithin(task.repeat, task.skippedDays, range, task.startDay)) return true

  return !isComplete(task, now) && isInPeriod(task, period, now)
}

/**
 * Whether the rule falls on a day of the range that was not skipped: a skipped
 * occurrence asks nothing of it, and neither does a day before the one picked
 * for the task (`startDay`) — a habit that starts next month is no part of this
 * month's count. The day picked itself, where the rule does not fall on it, is
 * counted as any day a task is due on is: by `isInPeriod` while still to do, and
 * by its completion once done.
 */
function occursWithin(
  repeat: Repeat,
  skipped: readonly LocalDay[],
  range: PeriodRange,
  startDay: LocalDay | null,
): boolean {
  // Rounded because a day either side of a daylight saving change is 23 or 25
  // hours long, and the count of whole days is what matters here.
  const days = Math.round((range.end.getTime() - range.start.getTime()) / MS_PER_DAY)

  for (let offset = 0; offset < days; offset += 1) {
    const day = dayAfter(range.start, offset)
    const local = toLocalDay(day)
    if (startDay !== null && local < startDay) {
      continue
    }
    if (occursOn(repeat, day) && !skipped.includes(local)) {
      return true
    }
  }

  return false
}
