/**
 * Rewards: the points a task earns each time it is done.
 *
 * A task carries only the amount its next completion earns. What completions
 * have already earned is a ledger of its own — one entry per completion — kept
 * apart from the tasks, so that earned stays earned: changing a task's amount,
 * taking it away, or deleting the task never reprices or wipes the past. Only
 * taking a completion back takes back what it gave.
 *
 * The ledger is written from the difference a change makes to the tasks
 * (`rewardChanges`), so every way a task can be finished or reopened — its box,
 * its checklist, a habit's day — earns and revokes through the same rule, and
 * no rule that changes a task has to know rewards exist.
 */

import { toLocalDay, type LocalDay } from './day'
import { repeatsEveryDay, type Repeat } from './repeat'
import type { Task, TaskId } from './task'

/** The least a single completion can be worth. */
export const MIN_REWARD = 1

/** The most a single completion can be worth. */
export const MAX_REWARD = 999

export class InvalidRewardError extends Error {
  constructor(points: number) {
    super(`${String(points)} is not a reward: a reward is a whole number of points from ${String(MIN_REWARD)} to ${String(MAX_REWARD)}.`)
    this.name = 'InvalidRewardError'
  }
}

/** Whether a task can be worth this many points a completion. */
export function isRewardAmount(points: number): boolean {
  return Number.isInteger(points) && points >= MIN_REWARD && points <= MAX_REWARD
}

/**
 * What a reward starts at when one is first given to a task: more for a task
 * that comes round less often. A weekly rule on all seven days is a daily one
 * under another name, and is worth what a daily one is.
 */
export function defaultReward(repeat: Repeat | null): number {
  if (repeat === null) return 1

  switch (repeat.kind) {
    case 'daily':
      return 1
    case 'weekly':
      return repeatsEveryDay(repeat) ? 1 : 5
    case 'monthly':
      return 25
  }
}

/**
 * Gives the task a reward, changes it, or takes it away with null. Only
 * completions from here on earn the new amount: what earlier ones earned is in
 * the ledger already, and stays as it was.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function setReward(task: Task, reward: number | null): Task {
  if (reward !== null && !isRewardAmount(reward)) {
    throw new InvalidRewardError(reward)
  }

  return reward === task.reward ? task : { ...task, reward }
}

export function hasReward(task: Task): boolean {
  return task.reward !== null
}

/**
 * What one completion earned: a task done on a day. A task is done at most once
 * a day — a repeating one once an occurrence, a one-off once — so the task and
 * the day name an entry, and writing the same one twice is writing it once.
 */
export interface RewardEntry {
  readonly taskId: TaskId
  readonly day: LocalDay
  readonly points: number
}

/** Which entry, without what it was worth: all taking one back needs. */
export interface RewardKey {
  readonly taskId: TaskId
  readonly day: LocalDay
}

/** What one change to the tasks earned and took back. */
export interface RewardChanges {
  readonly earned: readonly RewardEntry[]
  readonly revoked: readonly RewardKey[]
}

export function hasRewardChanges(changes: RewardChanges): boolean {
  return changes.earned.length > 0 || changes.revoked.length > 0
}

/**
 * The days the task stands done on: every day in a repeating task's history, or
 * the day a one-off was finished while it is. A one-off's history from when it
 * repeated is not a completion of the one-off.
 */
export function completionDays(task: Task): LocalDay[] {
  if (task.repeat !== null) {
    return [...new Set(task.doneDays)]
  }

  return task.status === 'done' && task.completedAt !== null ? [toLocalDay(new Date(task.completedAt))] : []
}

/**
 * What a change to the tasks earned and took back, task by task.
 *
 * A day a task newly stands done on earns the task's reward as it is now; one
 * without a reward earns nothing. A day it no longer stands done on is taken
 * back, whatever the reward is now, since taking back is undoing whatever that
 * completion gave.
 *
 * Only a completion counts. A task added or purged changes nothing — a purged
 * task's points stay earned — and neither does a change of rule, even where it
 * changes which days read as done: dropping a rule, or giving one back, is not
 * doing the task or undoing it. As in `changesBetween`, a task handed back as the
 * very same object was not changed.
 */
export function rewardChanges(before: readonly Task[], after: readonly Task[]): RewardChanges {
  const previous = new Map(before.map((task) => [task.id, task]))
  const earned: RewardEntry[] = []
  const revoked: RewardKey[] = []

  for (const task of after) {
    const was = previous.get(task.id)
    if (was === undefined || was === task || !sameRule(was.repeat, task.repeat)) continue

    const then = new Set(completionDays(was))
    const now = new Set(completionDays(task))

    if (task.reward !== null) {
      for (const day of now) {
        if (!then.has(day)) earned.push({ taskId: task.id, day, points: task.reward })
      }
    }

    for (const day of then) {
      if (!now.has(day)) revoked.push({ taskId: task.id, day })
    }
  }

  return { earned, revoked }
}

/** Whether two rules are the same rule, however they were put together. */
function sameRule(a: Repeat | null, b: Repeat | null): boolean {
  if (a === null || b === null) return a === b

  switch (a.kind) {
    case 'daily':
      return b.kind === 'daily'
    case 'weekly':
      return (
        b.kind === 'weekly' &&
        a.weekdays.every((day) => b.weekdays.includes(day)) &&
        b.weekdays.every((day) => a.weekdays.includes(day))
      )
    case 'monthly':
      return b.kind === 'monthly' && a.day === b.day
  }
}
