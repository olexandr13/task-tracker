/**
 * When a task is due, and the lists that follow from it.
 *
 * There is one question underneath everything here — which day is this task due,
 * as of now? A one-off answers with its date. A repeating task answers with the
 * occurrence in play, so a daily task is due today every day and a weekly one
 * missed on Monday is still due Monday on Tuesday. Everything else — overdue, in
 * Today — is that day read against today and against whether the task is done.
 *
 * Like the rest of ./repeat, nothing is stored or rolled over: the answer is
 * derived from `now`, so a page left open picks up the new day on its own.
 */

import { toLocalDay, type LocalDay } from './day'
import { currentOccurrence } from './repeat'
import { isComplete, isDeleted, type Task } from './task'

/**
 * The day the task is due as of `now`, or null when it has none.
 *
 * A repeating task's occurrence from before the task existed asked nothing of
 * it: a weekly Monday task written on a Tuesday is next due on Monday, not
 * overdue from the day before it was thought of.
 */
export function dueDay(task: Task, now: Date = new Date()): LocalDay | null {
  if (task.repeat === null) {
    return task.dueDate
  }

  const occurrence = toLocalDay(currentOccurrence(task.repeat, now))
  return occurrence < toLocalDay(new Date(task.createdAt)) ? null : occurrence
}

/** Due on a day already gone, and still not done. */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  return due !== null && due < toLocalDay(now) && !isComplete(task, now)
}

/**
 * Whether the task belongs in the Today list.
 *
 * To do, it belongs when it is due today or overdue — a day missed does not let
 * a task drop out of sight. Done, it stays for the day it was due, and for the
 * day an overdue one was finished on, so ticking something off does not make it
 * vanish. A task finished ahead of its day stays on its own day, and a task with
 * no day at all is never in Today, however recently it was touched.
 */
export function isInToday(task: Task, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  if (isDeleted(task) || due === null) {
    return false
  }

  const today = toLocalDay(now)
  if (!isComplete(task, now)) {
    return due <= today
  }

  const finishedToday = task.completedAt !== null && toLocalDay(new Date(task.completedAt)) === today
  return due === today || (due < today && finishedToday)
}
