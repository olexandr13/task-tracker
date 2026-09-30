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

import type { Placement } from './placement'
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
 * Puts one item just before or just after another. Order is all that changes —
 * same ids, same ticks — so a move can neither finish a task nor reopen one,
 * and a ticked item stays where it was put rather than sinking to the foot of
 * the list the way a done task does. Nothing moves against an item that is not
 * on the list, against itself, or into the place it is already in.
 *
 * A plain reordering of the array, unlike the numbers tasks carry (./order):
 * the whole task is one saved record, so there is nothing to merge item by item
 * and no number to hand out. This is the one operation on an item that cannot
 * change the task around it, which is why it can live here; ./task has the
 * task-shaped `moveSubtask` that call sites reach for.
 *
 * Returns a new list; the one passed in is never modified.
 */
export function reorderSubtasks(
  subtasks: readonly Subtask[],
  id: SubtaskId,
  targetId: SubtaskId,
  placement: Placement,
): readonly Subtask[] {
  const from = subtasks.findIndex((subtask) => subtask.id === id)
  if (from === -1 || id === targetId) {
    return subtasks
  }

  const rest = [...subtasks.slice(0, from), ...subtasks.slice(from + 1)]
  const target = rest.findIndex((subtask) => subtask.id === targetId)
  if (target === -1) {
    return subtasks
  }

  const at = placement === 'before' ? target : target + 1
  if (at === from) {
    return subtasks
  }

  return [...rest.slice(0, at), subtasks[from], ...rest.slice(at)]
}

/**
 * Ticking, renaming and removing an item are all operations on the **task**
 * that holds it — a tick can reopen the task, though it can never finish one
 * (CHK-9) — so they live in ./task with the rule that keeps the two in step,
 * rather than here where a subtask cannot see the task it belongs to.
 */
