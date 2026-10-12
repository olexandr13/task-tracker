/**
 * Limited rests: a habit's skip keeps the streak only while there is a rest to
 * spend on it, and rests are earned by keeping the habit (HAB-36 to HAB-40).
 *
 * Unlimited, a skip (HAB-31) could keep a streak going for ever without the
 * habit ever being done, which would empty the streak of meaning. With the
 * limit on, each habit starts with `REST_START` rests, earns one more for every
 * `REST_EVERY` days done in a row, and holds `REST_MAX` at most. A skip spends
 * one; a skip with none to spend reads as a day missed.
 *
 * The limit is the account's, switched on and off on Settings, and off it is
 * the app as it was: every skip a rest. What it holds is the day it was
 * switched on, and only skips from that day on are counted against it, so the
 * rests taken before stay rests.
 *
 * Like the rest of a habit's record (./habit), nothing is stored for the rests
 * themselves: how many a habit has, and which skips they covered, is walked
 * from its days each time it is asked. Taking a skip back gives its rest back
 * without anything to undo, and a skip arriving from a device that did not
 * know about the limit — an older version, one offline — finds its place in
 * the walk like any other: covered if a rest was there for it, missed if not.
 */

import { startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { canSkipOccurrence } from './due'
import { repeatsEveryDay } from './repeat'
import { startedOn, type Task } from './task'

/** How many rests a habit starts with, the day the limit or the habit begins. */
export const REST_START = 1
/** How many days done in a row earn a habit one more rest. */
export const REST_EVERY = 7
/** The most rests a habit holds; one earned past it is not kept. */
export const REST_MAX = 2

/** The limit, switched on: the day it was, from which skips count against it. */
export interface RestLimit {
  readonly since: LocalDay
}

/** The account's limit on rests, or null while it is off and every skip is a rest. */
export type HabitRests = RestLimit | null

/** How a habit stands for rests, as of today. */
export interface RestStanding {
  /** Rests there are to spend now, today's skip already paid for if today is one. */
  readonly left: number
  /** Days still to be done in a row before the next rest is earned, 1 to `REST_EVERY`. */
  readonly nextIn: number
  /** Days skipped since the limit began that a rest paid for: they stay rests. */
  readonly covered: ReadonlySet<LocalDay>
  /** Days skipped since the limit began with no rest to pay for them: they read as missed. */
  readonly uncovered: ReadonlySet<LocalDay>
}

/**
 * How many rests a habit has, which skips they covered and which they did not,
 * walked day by day from the later of the day the limit began and the day the
 * habit started (`startedOn`) up to today:
 *
 * - A day done adds one to the run. At `REST_EVERY` a rest is earned, up to
 *   `REST_MAX`, and the run starts again.
 * - A day skipped with a rest left spends it, and leaves the run as it was:
 *   the streak runs on across a rest, and so does the count towards the next.
 * - A day skipped with none left, or a day gone by without the habit, ends the
 *   run. Rests already earned are kept.
 *
 * Done wins over a skip (RPT-36). Today counts once it is done or skipped;
 * still to do, it is in play and ends nothing. Skips before the walk starts are
 * neither covered nor uncovered: they are rests as they always were.
 */
export function restsOf(task: Task, limit: RestLimit, now: Date = new Date()): RestStanding {
  const today = toLocalDay(now)
  const started = startedOn(task)
  const from = limit.since > started ? limit.since : started
  const done = new Set(task.doneDays)
  const skipped = new Set(task.skippedDays)
  const covered = new Set<LocalDay>()
  const uncovered = new Set<LocalDay>()
  let left = REST_START
  let run = 0

  // A date stepped a day at a time, rather than a day parsed back each step:
  // the walk can run a year or more for every habit on the page.
  const cursor = startOfLocalDay(from)
  for (let day = from; day <= today; cursor.setDate(cursor.getDate() + 1), day = toLocalDay(cursor)) {
    if (done.has(day)) {
      run += 1
      if (run === REST_EVERY) {
        left = Math.min(left + 1, REST_MAX)
        run = 0
      }
    } else if (skipped.has(day)) {
      if (left > 0) {
        left -= 1
        covered.add(day)
      } else {
        uncovered.add(day)
        run = 0
      }
    } else if (day !== today) {
      run = 0
    }
  }

  return { left, nextIn: REST_EVERY - run, covered, uncovered }
}

/**
 * Whether the occurrence in play can be passed over now (`canSkipOccurrence`)
 * and, on a habit while the limit is on, there is a rest to spend on it. A
 * task that is not a habit skips as often as it likes (RPT-34): its rule has
 * days off of its own, and no streak to keep.
 */
export function canRest(task: Task, rests: HabitRests, now: Date = new Date()): boolean {
  if (!canSkipOccurrence(task, now)) return false
  if (rests === null || task.repeat === null || !repeatsEveryDay(task.repeat)) return true
  return restsOf(task, rests, now).left > 0
}

/** Whether a skip on offer would be turned down for want of a rest (HAB-38). */
export function isOutOfRests(task: Task, rests: HabitRests, now: Date = new Date()): boolean {
  return canSkipOccurrence(task, now) && !canRest(task, rests, now)
}
