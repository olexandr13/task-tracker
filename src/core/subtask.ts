/**
 * A checklist item: one part of a task, ticked on its own.
 *
 * A subtask is not a small task. It has no rule of its own, no trash and no
 * place in any period's count — it borrows the task's rule to answer the only
 * question it has, which is whether it reads as done *now*. That keeps the
 * checklist honest when the task repeats: ticks are derived against the
 * occurrence in play, so a daily routine's list is blank again tomorrow without
 * anything having to run at midnight. The same trick as ./repeat and ./trash.
 *
 * This module knows about `Repeat` and nothing about `Task`, which is what lets
 * ./task import it rather than the other way round.
 */

import { countsForCurrentOccurrence, type Repeat } from './repeat'
import { normalizeTitle } from './title'

export type SubtaskId = string

export interface Subtask {
  readonly id: SubtaskId
  readonly title: string
  /** ISO 8601 timestamp. */
  readonly createdAt: string
  /**
   * ISO 8601 timestamp of the most recent tick, or null if it has never been
   * ticked. Not the answer to "is it done now" — that is `isSubtaskComplete`,
   * which reads this against the parent's rule.
   *
   * There is no `status` field to go with it, as a task has: a task carries one
   * only because the saved shape predates repeating tasks, and a subtask starts
   * with no such history to keep.
   */
  readonly completedAt: string | null
}

/**
 * `now` is injectable for the same reason it is everywhere else in this layer:
 * tests stay deterministic, and time-based rules have a seam to hook into.
 */
export function createSubtask(title: string, now: Date = new Date()): Subtask {
  return {
    id: crypto.randomUUID(),
    title: normalizeTitle(title),
    createdAt: now.toISOString(),
    completedAt: null,
  }
}

/**
 * Whether the item reads as done *as of `now`*, given the rule of the task it
 * belongs to. Under a task that happens once a tick is simply a tick; under a
 * repeating one it only counts for the occurrence currently in play, so the
 * list comes back with the task itself.
 */
export function isSubtaskComplete(subtask: Subtask, repeat: Repeat | null, now: Date = new Date()): boolean {
  if (subtask.completedAt === null) {
    return false
  }

  if (repeat === null) {
    return true
  }

  return countsForCurrentOccurrence(subtask.completedAt, repeat, now)
}

/**
 * Ticking, renaming and removing an item are all operations on the **task** that
 * holds it — a tick can finish the task, and removing the last open item can
 * too — so they live in ./task with the rule that keeps the two in step, rather
 * than here where a subtask cannot see the task it belongs to.
 */
