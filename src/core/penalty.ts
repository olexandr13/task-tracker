/**
 * Skipping a habit costs points: **twice** what doing it would have earned
 * (HAB-34).
 *
 * A rest is allowed (HAB-31), but it is not free. Were it free, skipping would
 * be the cheaper way to clear Today; costing only what the day was worth, it
 * would still lose nothing next to a miss. Twice the reward makes doing it the
 * better deal by far, and a rest something taken on purpose.
 *
 * What a skip cost is kept beside the redemptions, as points off the balance
 * (./redemption): one record per habit and day, under an id named for the two,
 * so the same skip written by two devices is written once, and giving it back
 * finds it without looking. It keeps what it was taken at, so giving it back
 * gives back exactly that, whatever the reward is now.
 *
 * Like what a completion earns (./reward), it is written from the difference a
 * change makes to the tasks (`penaltyChanges`), so every way a habit's day comes
 * to rest or stops resting costs and gives back through the same rule: a skip,
 * the skip taken back, the day done after all (RPT-36) and that tick taken back
 * again.
 */

import { startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { habitRestDays } from './habit'
import type { Redemption, RedemptionId, SkippedDay } from './redemption'
import { repeatsEveryDay, sameRepeat } from './repeat'
import type { Task } from './task'

/** How many times its reward a habit's skipped day costs. */
export const SKIP_PENALTY_FACTOR = 2

/**
 * What skipping the habit today would cost: twice its reward, or 0 for a task
 * that is not a habit or has no reward — nothing to lose where nothing is earned.
 */
export function skipPenalty(task: Task): number {
  return task.repeat !== null && repeatsEveryDay(task.repeat) && task.reward !== null
    ? task.reward * SKIP_PENALTY_FACTOR
    : 0
}

/**
 * The id a skip's penalty is kept under. Named for the habit and the day rather
 * than random, so one skip is one record however many devices write it, and
 * taking it back needs no lookup. A redemption's id is a `crypto.randomUUID()`,
 * which never begins this way.
 */
export function skipPenaltyId({ taskId, day }: SkippedDay): RedemptionId {
  return `skip-${taskId}-${day}`
}

/** What one change to the tasks cost in skips and gave back. */
export interface PenaltyChanges {
  readonly charged: readonly Redemption[]
  readonly refunded: readonly RedemptionId[]
}

export function hasPenaltyChanges(changes: PenaltyChanges): boolean {
  return changes.charged.length > 0 || changes.refunded.length > 0
}

/**
 * What a change to the tasks cost and gave back in skips, habit by habit.
 *
 * A day a habit newly rests on costs twice the habit's reward as it is now, and
 * one without a reward costs nothing. A day it no longer rests on — the skip
 * taken back, or the day done after all — gives back whatever it cost; a day
 * that cost nothing has nothing to give back, and the id names no record.
 *
 * The record's note is the habit's title as it stands, so the history reads the
 * same after the habit is renamed or gone, as a redemption keeps the name of
 * what it bought.
 *
 * Only a change of rest counts, as only a completion counts for earning: a task
 * added or purged, or a change of rule, costs and gives back nothing. A task
 * handed back as the very same object was not changed.
 */
export function penaltyChanges(before: readonly Task[], after: readonly Task[], now: Date = new Date()): PenaltyChanges {
  const previous = new Map(before.map((task) => [task.id, task]))
  const charged: Redemption[] = []
  const refunded: RedemptionId[] = []

  for (const task of after) {
    const was = previous.get(task.id)
    // A change of rule costs nothing, as it earns nothing (RWD-12).
    if (was === undefined || was === task || !sameRepeat(was.repeat, task.repeat)) continue

    const then = new Set(habitRestDays(was, now))
    const rests = habitRestDays(task, now)
    const points = skipPenalty(task)

    if (points > 0) {
      for (const day of rests) {
        if (then.has(day)) continue
        const skip = { taskId: task.id, day }
        charged.push({ id: skipPenaltyId(skip), points, note: task.title, redeemedAt: takenAt(day, now), skip })
      }
    }

    for (const day of then) {
      if (!rests.includes(day)) refunded.push(skipPenaltyId({ taskId: task.id, day }))
    }
  }

  return { charged, refunded }
}

/**
 * When a skip's penalty is made out: now, for today; the start of the day, for a
 * day gone by coming to rest again — a tick taken back on the Habits page
 * (HAB-16). Either way it counts on the day that rests (RWD-21).
 */
function takenAt(day: LocalDay, now: Date): string {
  return (day === toLocalDay(now) ? now : startOfLocalDay(day)).toISOString()
}
