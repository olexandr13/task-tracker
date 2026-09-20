/**
 * The rules of a task.
 *
 * This layer is pure TypeScript: no React, no browser APIs, no saving or loading.
 * Everything here is a pure function over plain data, so it stays testable and
 * reusable if the app ever grows a second front end. See CLAUDE.md.
 */

import { InvalidDayError, isLocalDay, toLocalDay, type LocalDay } from './day'
// Type-only: ./list reads the task's rules, so nothing is imported back from it.
import type { ListId } from './list'
import { assertValidRepeat, countsForCurrentOccurrence, currentOccurrence, type Repeat } from './repeat'
import { createSubtask, isSubtaskComplete, type Subtask, type SubtaskId } from './subtask'
import { currentEntries, type TimeEntry } from './timeLog'
import { normalizeTitle } from './title'

export type TaskId = string

export type TaskStatus = 'todo' | 'done'

export interface Task {
  readonly id: TaskId
  readonly title: string
  /**
   * Free text about the task, or `''` when there is none. Unlike a title, an
   * empty description is a fair thing to want — clearing one is ordinary — so
   * emptiness is spelled a single way rather than being split between `''` and
   * `null`, which would only invite one of them to be forgotten.
   */
  readonly description: string
  /**
   * The last thing that happened to the task. For a repeating task this is the
   * record of its most recent completion, not the answer to "is it done now" —
   * that answer is `isComplete`, which takes the current occurrence into account.
   */
  readonly status: TaskStatus
  /** ISO 8601 timestamp. */
  readonly createdAt: string
  /** ISO 8601 timestamp, or null while the task is still todo. */
  readonly completedAt: string | null
  /** A recurrence rule, or null for a task that happens once. */
  readonly repeat: Repeat | null
  /**
   * The local days a repeating task was done on, oldest first — its history,
   * which `completedAt` alone cannot be, since that holds only the latest one.
   * Kept in step with whether the task reads as done; see `settleHistory`. A
   * task that happens once needs no history and records none, but keeps what it
   * gathered while it repeated, should it repeat again.
   */
  readonly doneDays: readonly LocalDay[]
  /**
   * The local days of a repeating task's occurrences passed over without being
   * done, oldest first — see `skipOccurrence` in ./due. A skipped occurrence
   * hands the task on to its next one, so it is not due, overdue or counted on
   * that day. A day is passed over by being skipped outright, or by reopening a
   * task whose occurrence has gone by (`passOverMissedOccurrence`). Done wins:
   * an occurrence ticked off after all reads as done, and the day stays here
   * only so that taking the tick back passes it over again.
   */
  readonly skippedDays: readonly LocalDay[]
  /**
   * The local day a one-off is due, or null for one that has no day. Always null
   * on a repeating task: its rule is what says which days it falls on. See ./due.
   */
  readonly dueDate: LocalDay | null
  /**
   * The checklist, in the order it was written. Empty for a task that has no
   * parts worth naming — which is most of them. A task carrying one is done
   * exactly when every item on it is; see `syncWithSubtasks`. The items are not
   * tasks: they never reach a period's count, and they have no trash of their
   * own. See ./subtask.
   */
  readonly subtasks: readonly Subtask[]
  /**
   * The tags the task carries, in the order they were put on it, each once
   * whatever its case. Empty for a task with none. See ./tag.
   */
  readonly tags: readonly string[]
  /**
   * The list the task is filed under, or null for one in no list — the Inbox.
   * One at a time, unlike tags: a list is where a task lives rather than
   * something it is about. Named by id, so renaming a list leaves its tasks
   * alone. See ./list.
   */
  readonly listId: ListId | null
  /**
   * The points each completion of the task earns, or null for a task that earns
   * none — which is every task until it is given some. Only the amount for the
   * next completion lives here; what completions already earned is kept apart
   * from the task, so it outlives a change of amount and the task itself. See ./reward.
   */
  readonly reward: number | null
  /**
   * The minutes the task asks for, or null for a task that is not an amount of
   * time — which is most of them. Reaching it says the task is ready to be
   * ticked off; it never ticks it. See ./timeLog.
   */
  readonly timeGoal: number | null
  /**
   * The sessions logged against the task, oldest first. Under a repeating task
   * only those of the occurrence in play count, and logging lets go of the rest,
   * so this never grows into a history. See ./timeLog.
   */
  readonly timeLog: readonly TimeEntry[]
  /**
   * ISO 8601 timestamp of when the task went to the trash, or null while it is
   * live. Deleting is reversible, so a deleted task is still a task — it is just
   * no longer part of the list, or of any period's count. See ./trash.
   */
  readonly deletedAt: string | null
  /**
   * Where the task sits in the list: lower comes first. Done tasks still sink
   * below the rest; this orders each group. See ./order.
   */
  readonly order: number
}

/**
 * `now` is injectable so tests stay deterministic, and so future rules that care
 * about time (streaks, daily quotas) have a seam to hook into.
 *
 * A task on its own is first in nothing: `appendTask` is what gives it its place
 * at the end of a list.
 */
export function createTask(title: string, repeat: Repeat | null = null, now: Date = new Date()): Task {
  const trimmed = normalizeTitle(title)

  if (repeat !== null) {
    assertValidRepeat(repeat)
  }

  return {
    id: crypto.randomUUID(),
    title: trimmed,
    description: '',
    status: 'todo',
    createdAt: now.toISOString(),
    completedAt: null,
    repeat,
    doneDays: [],
    skippedDays: [],
    dueDate: null,
    subtasks: [],
    tags: [],
    listId: null,
    reward: null,
    timeGoal: null,
    timeLog: [],
    deletedAt: null,
    order: 0,
  }
}

/**
 * A new task carrying what this one says — title, description, rule, due date,
 * checklist, tags, reward, time goal — and none of what has happened to it. It
 * is not done, its checklist is unticked, it has no time logged, a repeating one
 * has no history, and it is not in the trash: a copy is another go at the same
 * thing, not a second record of the first.
 *
 * Its place in the list is the caller's to give, as with `createTask`; see
 * `insertTask` in ./order. Returns a new task; the one passed in is never modified.
 */
export function duplicateTask(task: Task, now: Date = new Date()): Task {
  const at = now.toISOString()

  return {
    ...task,
    id: crypto.randomUUID(),
    status: 'todo',
    createdAt: at,
    completedAt: null,
    doneDays: [],
    skippedDays: [],
    subtasks: task.subtasks.map((subtask) => ({ ...subtask, id: crypto.randomUUID(), createdAt: at, completedAt: null })),
    timeLog: [],
    deletedAt: null,
  }
}

/**
 * Changes the title and nothing else. The task keeps its id, its completion
 * record and its rule, so a rename stays a rename: nothing counting tasks or
 * deriving progress from them sees a different task afterwards.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function renameTask(task: Task, title: string): Task {
  const trimmed = normalizeTitle(title)
  if (trimmed === task.title) {
    return task
  }

  return { ...task, title: trimmed }
}

/**
 * Writes the description, or clears it with an empty string. Like a rename this
 * changes one field and leaves the rest of the record alone, so a task that has
 * had something written about it is still the same task.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function setDescription(task: Task, description: string): Task {
  // Trimming the ends and not the middle: the blank lines *between* paragraphs
  // are part of what was written, the ones around it are not.
  const trimmed = description.trim()
  if (trimmed === task.description) {
    return task
  }

  return { ...task, description: trimmed }
}

export function hasDescription(task: Task): boolean {
  return task.description.length > 0
}

/**
 * Ticking the task ticks its checklist with it, so a done task never sits there
 * showing open items. That is the task's own box speaking for the whole thing —
 * an item ticked one at a time goes through `setSubtaskDone` instead.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function completeTask(task: Task, now: Date = new Date()): Task {
  if (isComplete(task, now)) {
    return task
  }

  const at = now.toISOString()

  return settleHistory(
    {
      ...task,
      status: 'done',
      completedAt: at,
      subtasks: task.subtasks.map((subtask) =>
        isSubtaskComplete(subtask, task.repeat, now) ? subtask : { ...subtask, completedAt: at },
      ),
    },
    now,
  )
}

/**
 * The inverse of completing: the task goes back to todo and forgets when it was
 * done, and its checklist is cleared with it for the same reason completing
 * ticked it. For a repeating task that undoes the occurrence in play, and where
 * that occurrence has gone by, hands the task on to the rule's next day rather
 * than back onto a day it can no longer do anything about (RPT-38).
 *
 * Returns a new task; the one passed in is never modified.
 */
export function uncompleteTask(task: Task, now: Date = new Date()): Task {
  if (!isComplete(task, now)) {
    return task
  }

  return reopen(
    {
      ...task,
      status: 'todo',
      completedAt: null,
      subtasks: task.subtasks.map((subtask) =>
        subtask.completedAt === null ? subtask : { ...subtask, completedAt: null },
      ),
    },
    now,
  )
}

/**
 * Whether the task is done *as of `now`*. A task that happens once is simply
 * done or not. A repeating task is done when its last completion falls within
 * the occurrence currently in play, so a daily task ticked off yesterday reads
 * as todo again today without anything having to rewrite it at midnight.
 */
export function isComplete(task: Task, now: Date = new Date()): boolean {
  if (task.repeat === null) {
    return task.status === 'done'
  }

  if (task.completedAt === null) {
    return false
  }

  return countsForCurrentOccurrence(task.completedAt, task.repeat, now)
}

/**
 * Brings a repeating task's history into line with whether it reads as done:
 * while it is, the day its completion was stamped on is in the history; while
 * it is not, nothing from the occurrence in play is, so taking a tick back takes
 * its day back with it (RPT-11). Days from occurrences that have gone by are
 * never touched — they are what happened.
 *
 * Every rule that can finish or reopen a task ends here, so the history can
 * never disagree with the task's own box. Returns the task itself when there is
 * nothing to change.
 */
function settleHistory(task: Task, now: Date): Task {
  if (task.repeat === null) {
    return task
  }

  if (task.completedAt !== null && isComplete(task, now)) {
    const day = toLocalDay(new Date(task.completedAt))
    return task.doneDays.includes(day) ? task : { ...task, doneDays: [...task.doneDays, day].sort() }
  }

  const occurrence = toLocalDay(currentOccurrence(task.repeat, now))
  const kept = task.doneDays.filter((day) => day < occurrence)
  return kept.length === task.doneDays.length ? task : { ...task, doneDays: kept }
}

/**
 * What every way of reopening a task ends with: its history settled behind it,
 * and an occurrence that has gone by passed over rather than left sitting on a
 * day already missed.
 */
function reopen(task: Task, now: Date): Task {
  return passOverMissedOccurrence(settleHistory(task, now), now)
}

/**
 * Hands a reopened repeating task on to the rule's next day where the occurrence
 * in play has gone by, so taking a tick back cannot drop it onto a day that is
 * already missed (RPT-38). The day is only ever recorded, never taken away:
 * ticking the task off again does that occurrence after all (RPT-36).
 *
 * The three guards are exactly what `isOverdue` in ./due reads as missed — the
 * occurrence has gone by, the task already existed on it, and it was not passed
 * over already — so nothing is ever skipped that was not. This writes the same
 * record `skipOccurrence` there does; it cannot call it, since ./due is the
 * layer above this one.
 */
function passOverMissedOccurrence(task: Task, now: Date): Task {
  if (task.repeat === null) {
    return task
  }

  const occurrence = toLocalDay(currentOccurrence(task.repeat, now))
  if (occurrence >= toLocalDay(now) || occurrence < toLocalDay(new Date(task.createdAt))) {
    return task
  }

  return task.skippedDays.includes(occurrence)
    ? task
    : { ...task, skippedDays: [...task.skippedDays, occurrence].sort() }
}

/**
 * Moves the task to the trash. Nothing else about it changes: a restored task
 * comes back exactly as it was, down to a repeating task's current occurrence.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function deleteTask(task: Task, now: Date = new Date()): Task {
  if (isDeleted(task)) {
    return task
  }

  return { ...task, deletedAt: now.toISOString() }
}

/** Takes the task back out of the trash. Returns a new task; the one passed in is never modified. */
export function restoreTask(task: Task): Task {
  if (!isDeleted(task)) {
    return task
  }

  return { ...task, deletedAt: null }
}

export function isDeleted(task: Task): boolean {
  return task.deletedAt !== null
}

/**
 * Gives a task a recurrence rule, drops it, or swaps one for another.
 *
 * The completion record is kept, because how a task reads is derived from it:
 * a one-off ticked off this morning that becomes a daily task is still done
 * today. The one case that needs a hand is the reverse — a repeating task that
 * had already come round again would suddenly read as a finished one-off, since
 * its stored status is still the `done` of an occurrence that has passed. Its
 * checklist and its logged time need the same hand for the same reason: a tick
 * or a session from an occurrence that has gone by would harden into a permanent one.
 */
export function setRepeat(task: Task, repeat: Repeat | null, now: Date = new Date()): Task {
  if (repeat !== null) {
    assertValidRepeat(repeat)
  }

  if (repeat === null) {
    const subtasks = task.subtasks.map((subtask) => forgetStaleTick(subtask, task.repeat, now))
    const timeLog = currentEntries(task.timeLog, task.repeat, now)

    if (!isComplete(task, now)) {
      return { ...task, repeat: null, status: 'todo', completedAt: null, subtasks, timeLog }
    }

    return { ...task, repeat: null, subtasks, timeLog }
  }

  // The rule decides the days from here on, so a date set before it would only
  // be a second, disagreeing answer. A completion that still stands under the
  // new rule goes into the history, the way ticking it off under the rule would have.
  return settleHistory({ ...task, repeat, dueDate: null }, now)
}

export class DueDateOnRepeatingTaskError extends Error {
  constructor() {
    super('A repeating task is due on the days its rule gives it, not on a date of its own.')
    this.name = 'DueDateOnRepeatingTaskError'
  }
}

/**
 * Gives a one-off the day it is due, moves it, or takes the day away with null.
 * Nothing else changes: a task finished early or late keeps its completion, so
 * moving the date is never a way to undo a tick.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function setDueDate(task: Task, dueDate: LocalDay | null): Task {
  if (dueDate !== null && !isLocalDay(dueDate)) {
    throw new InvalidDayError(dueDate)
  }

  if (dueDate === task.dueDate) {
    return task
  }

  if (dueDate !== null && task.repeat !== null) {
    throw new DueDateOnRepeatingTaskError()
  }

  return { ...task, dueDate }
}

/**
 * Makes the task a one-off due on `dueDate`. A repeating task's rule ends first,
 * exactly as choosing Once would, since only a one-off carries a date of its
 * own; a one-off just has its day set, as `setDueDate` does.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function scheduleOnce(task: Task, dueDate: LocalDay, now: Date = new Date()): Task {
  return setDueDate(task.repeat === null ? task : setRepeat(task, null, now), dueDate)
}

/** Lets go of a tick that no longer counts, leaving live ones — and blanks — alone. */
function forgetStaleTick(subtask: Subtask, repeat: Repeat | null, now: Date): Subtask {
  if (subtask.completedAt === null || isSubtaskComplete(subtask, repeat, now)) {
    return subtask
  }

  return { ...subtask, completedAt: null }
}

export function isRepeating(task: Task): boolean {
  return task.repeat !== null
}

/**
 * A task with a checklist is done exactly when every item on it is.
 *
 * This runs after every change to the list, so the task's stored completion can
 * never disagree with what the list shows: the last tick finishes the task,
 * taking any tick back reopens it, and so does adding a fresh item to a task
 * already done. A task with no checklist is left to its own box.
 *
 * It settles the task and never the list — unlike `completeTask`, which speaks
 * for the whole thing. That is the difference between unticking one item of five
 * and unticking the task itself: the first must leave the other four alone.
 */
function syncWithSubtasks(task: Task, now: Date): Task {
  if (task.subtasks.length === 0) {
    return task
  }

  const done = isComplete(task, now)
  const allDone = task.subtasks.every((subtask) => isSubtaskComplete(subtask, task.repeat, now))

  if (allDone === done) {
    return task
  }

  return allDone
    ? settleHistory({ ...task, status: 'done', completedAt: now.toISOString() }, now)
    : reopen({ ...task, status: 'todo', completedAt: null }, now)
}

/**
 * Adds an item to the end of the checklist. The new item is not done, so a task
 * that was finished is not any more — you have just given it another part.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function addSubtask(task: Task, title: string, now: Date = new Date()): Task {
  return insertSubtask(task, task.subtasks.length, title, now)
}

/**
 * Adds an item at `index`, pushing the ones from there down — the line opened
 * under an item. An index past either end is held to it. Reopens a finished
 * task, as ./addSubtask does.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function insertSubtask(task: Task, index: number, title: string, now: Date = new Date()): Task {
  const at = Math.min(Math.max(index, 0), task.subtasks.length)
  const subtasks = [...task.subtasks.slice(0, at), createSubtask(title, now), ...task.subtasks.slice(at)]
  return syncWithSubtasks({ ...task, subtasks }, now)
}

/**
 * Changes one item's title and nothing else — same id, same tick — so renaming
 * can neither finish a task nor reopen one.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function renameSubtask(task: Task, subtaskId: SubtaskId, title: string): Task {
  const trimmed = normalizeTitle(title)
  const target = task.subtasks.find((subtask) => subtask.id === subtaskId)
  if (target === undefined || target.title === trimmed) {
    return task
  }

  return {
    ...task,
    subtasks: task.subtasks.map((subtask) => (subtask === target ? { ...subtask, title: trimmed } : subtask)),
  }
}

/**
 * Takes an item off the list. Removing the last one that was still open finishes
 * the task; emptying the list altogether hands the decision back to the task's
 * own box, which is the only thing left to answer it.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function removeSubtask(task: Task, subtaskId: SubtaskId, now: Date = new Date()): Task {
  const kept = task.subtasks.filter((subtask) => subtask.id !== subtaskId)
  if (kept.length === task.subtasks.length) {
    return task
  }

  return syncWithSubtasks({ ...task, subtasks: kept }, now)
}

/**
 * Ticks one item, or unticks it, and brings the task into line behind it.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function setSubtaskDone(
  task: Task,
  subtaskId: SubtaskId,
  done: boolean,
  now: Date = new Date(),
): Task {
  const target = task.subtasks.find((subtask) => subtask.id === subtaskId)
  if (target === undefined || isSubtaskComplete(target, task.repeat, now) === done) {
    return task
  }

  const subtasks = task.subtasks.map((subtask) =>
    subtask === target ? { ...subtask, completedAt: done ? now.toISOString() : null } : subtask,
  )

  return syncWithSubtasks({ ...task, subtasks }, now)
}

/** How the checklist stands as of `now` — what a row reads out as "2/5". */
export function countSubtasks(task: Task, now: Date = new Date()): { done: number; total: number } {
  return {
    done: task.subtasks.filter((subtask) => isSubtaskComplete(subtask, task.repeat, now)).length,
    total: task.subtasks.length,
  }
}

export function hasSubtasks(task: Task): boolean {
  return task.subtasks.length > 0
}
