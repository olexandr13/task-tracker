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

import { startOfLocalDay } from './day'
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
    if (!done && !inPlayDuring(task, range, now)) {
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

function inPlayDuring(task: Task, range: PeriodRange, now: Date): boolean {
  if (task.repeat === null) {
    // A one-off with no day of its own sits in every period's count until it is
    // done. One with a day belongs from that day on: to the period it falls in,
    // and to every later one it is still undone in, so letting it slip does not
    // take it out of the count.
    if (isComplete(task, now)) return false
    return task.dueDate === null || startOfLocalDay(task.dueDate) < range.end
  }

  return occursWithin(task.repeat, range)
}

function occursWithin(repeat: Repeat, range: PeriodRange): boolean {
  // Rounded because a day either side of a daylight saving change is 23 or 25
  // hours long, and the count of whole days is what matters here.
  const days = Math.round((range.end.getTime() - range.start.getTime()) / MS_PER_DAY)

  for (let offset = 0; offset < days; offset += 1) {
    if (occursOn(repeat, dayAfter(range.start, offset))) {
      return true
    }
  }

  return false
}
