/**
 * The Today bonus: points for clearing Today, on top of what each task earns.
 *
 * A task's reward pays for the task; this pays for the day. It is one amount
 * for the whole account rather than anything a task carries, and what it earns
 * goes into the same ledger as every other completion (./reward), under an id
 * of its own — so a day's bonus counts towards the periods, can be taken off a
 * day, and stays earned whatever becomes of the tasks that earned it.
 *
 * Whether the day is clear is not stored either: it is the question the Today
 * bar already answers (./progress), asked of the tasks as they stand. A change
 * that leaves Today clear earns the bonus for that day; one that leaves it
 * unclear again takes it back, as taking a completion back does.
 */

import { toLocalDay } from './day'
import { summarize } from './progress'
import type { RewardChanges } from './reward'
import type { Task, TaskId } from './task'

/**
 * What the bonus is recorded under in place of a task. Tasks are named by
 * `crypto.randomUUID()`, so this is no task's id and never will be.
 */
export const TODAY_BONUS_ID: TaskId = 'today-bonus'

/** What the first bonus stepped up from none is worth: a day asks more than a task. */
export const DEFAULT_TODAY_BONUS = 5

export function isTodayBonus(taskId: TaskId): boolean {
  return taskId === TODAY_BONUS_ID
}

/**
 * Whether everything Today asks for is done — the moment its bar reads 100%
 * (PROG-3). A day with nothing on it is not cleared: there was nothing to clear.
 */
export function isTodayCleared(tasks: readonly Task[], now: Date = new Date()): boolean {
  const { total, remaining } = summarize(tasks, 'today', now)
  return total > 0 && remaining === 0
}

/**
 * `changes`, plus what a change to the tasks did to the day's bonus: earned
 * where it left Today clear, taken back where it left it unclear again. A day
 * that was clear either way changes nothing, so the bonus is earned once a day
 * however many tasks are finished after it.
 *
 * Taking back does not ask what the bonus is now — it undoes whatever that day
 * was given, as with a task's reward (RWD-11) — so turning the bonus off leaves
 * what earlier days earned and still lets today's go back where it came from.
 *
 * Only this day's bonus is ever touched: an earlier day is done with, and
 * nothing that happens now can reach it.
 */
export function withTodayBonus(
  changes: RewardChanges,
  before: readonly Task[],
  after: readonly Task[],
  bonus: number | null,
  now: Date = new Date(),
): RewardChanges {
  const was = isTodayCleared(before, now)
  const is = isTodayCleared(after, now)
  if (was === is) return changes

  const day = toLocalDay(now)
  if (!is) return { earned: changes.earned, revoked: [...changes.revoked, { taskId: TODAY_BONUS_ID, day }] }
  if (bonus === null) return changes

  return { earned: [...changes.earned, { taskId: TODAY_BONUS_ID, day, points: bonus }], revoked: changes.revoked }
}
