/**
 * Warm-up mode: the first days taken one habit at a time.
 *
 * A list of ten habits written in an hour of enthusiasm is ten ways to fall
 * behind by the weekend, and falling behind is what the app is for fighting.
 * So a warm-up lets the habits in slowly — one on its first day, two on its
 * second, and so on for a month, after which it is over and asks nothing.
 *
 * Only habits (./habit) are held back. Ordinary tasks are what a day actually
 * holds and are never limited: the warm-up is about what is taken on for every
 * day to come, not about what there is to do today.
 *
 * Pure derivation over the tasks, the day it started and the day it is now, in
 * the way of the rest of this layer. What is stored is the one thing that
 * cannot be worked out — the day it began (`WarmUp`); the day it is on, what it
 * allows and whether that is used up all follow from the tasks as they stand,
 * so nothing has to be rewritten at midnight for tomorrow to allow one more
 * (PRIN-2).
 */

import { daysBetween, toLocalDay, type LocalDay } from './day'
import { habitTasks } from './habit'
import type { Task } from './task'

/** How many days a warm-up runs for, its first day included. */
export const WARM_UP_DAYS = 30

/**
 * A warm-up under way, or being remembered: the day it began, which is all it
 * takes to say which day it is on and how much it allows.
 */
export interface WarmUp {
  /** The local day it was started on — its day one. */
  readonly startedOn: LocalDay
}

/** A warm-up beginning today. */
export function startWarmUp(now: Date = new Date()): WarmUp {
  return { startedOn: toLocalDay(now) }
}

/**
 * Which day of the warm-up `now` falls in — 1 on the day it began, up to
 * `WARM_UP_DAYS` — or null when there is no warm-up, or it has run its course.
 *
 * A day before it began reads as its first day rather than as a day zero or a
 * negative one: a device whose clock is a day behind is not owed a warm-up of
 * its own.
 */
export function warmUpDay(warmUp: WarmUp | null, now: Date = new Date()): number | null {
  if (warmUp === null) return null

  const day = daysBetween(warmUp.startedOn, toLocalDay(now)) + 1
  if (day > WARM_UP_DAYS) return null
  return Math.max(1, day)
}

/** Whether a warm-up is under way at `now` — started, and not yet run its course. */
export function isWarmingUp(warmUp: WarmUp | null, now: Date = new Date()): boolean {
  return warmUpDay(warmUp, now) !== null
}

/** How many habits a warm-up allows on its nth day: one more with every day. */
export function habitAllowance(day: number): number {
  return day
}

/** Where a warm-up stands: which day it is on, and how much of that day's allowance is taken. */
export interface WarmUpProgress {
  /** 1 on the day it began, up to `WARM_UP_DAYS`. */
  readonly day: number
  /** Days still to come after today, 0 on the last of them. */
  readonly daysLeft: number
  /** How many habits this day allows (`habitAllowance`). */
  readonly allowed: number
  /** How many there are — every habit not in the trash, however it came to be one. */
  readonly used: number
  /** How many more may be taken on today, 0 once the allowance is used up. */
  readonly remaining: number
}

/**
 * Where the warm-up stands at `now`, or null when none is under way — nothing
 * started, or a month gone by since it was.
 *
 * What counts against the allowance is simply **how many habits there are**
 * (`habitTasks`, so the trash is out of it), not how many were taken on since
 * the warm-up began. That way there is one number to understand and no way
 * round it: converting an old task to a daily rule, or duplicating a habit,
 * counts exactly as much as writing a new one. An account that already keeps
 * more habits than the day allows takes none on until the days catch up, and
 * loses none of the ones it has — a warm-up never deletes anything.
 */
export function warmUpProgress(
  warmUp: WarmUp | null,
  tasks: readonly Task[],
  now: Date = new Date(),
): WarmUpProgress | null {
  const day = warmUpDay(warmUp, now)
  if (day === null) return null

  const allowed = habitAllowance(day)
  const used = habitTasks(tasks).length

  return {
    day,
    daysLeft: WARM_UP_DAYS - day,
    allowed,
    used,
    remaining: Math.max(0, allowed - used),
  }
}

/**
 * Whether one more habit may be taken on at `now`. True whenever no warm-up is
 * under way, so the question can be asked without knowing whether there is one.
 */
export function canTakeOnHabit(
  warmUp: WarmUp | null,
  tasks: readonly Task[],
  now: Date = new Date(),
): boolean {
  const progress = warmUpProgress(warmUp, tasks, now)
  return progress === null || progress.remaining > 0
}
