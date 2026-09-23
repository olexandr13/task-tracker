/**
 * When a task is due, and the lists that follow from it.
 *
 * There is one question underneath everything here — which day is this task due,
 * as of now? A one-off answers with its date. A repeating task answers with the
 * occurrence in play, so a daily task is due today every day and a weekly one
 * missed on Monday is still due Monday on Tuesday. Everything else — overdue, in
 * Today, Week or Month — is that day read against today and against whether the
 * task is done.
 *
 * Like the rest of ./repeat, nothing is stored or rolled over: the answer is
 * derived from `now`, so a page left open picks up the new day on its own.
 */

import { offsetDay, toLocalDay, type LocalDay } from './day'
import { periodRange, type Period } from './progress'
import { currentOccurrence, nextOccurrence } from './repeat'
import { isComplete, isDeleted, type Task } from './task'

/**
 * The day the task is due as of `now`, or null when it has none.
 *
 * A repeating task's occurrence from before the task existed asked nothing of
 * it: a weekly Monday task written on a Tuesday is next due on Monday, not
 * overdue from the day before it was thought of.
 *
 * A skipped occurrence hands the task on to the next one the rule gives, and
 * that one on again while it was skipped too — unless the task was done after
 * all, which reads as done on the occurrence in play.
 */
export function dueDay(task: Task, now: Date = new Date()): LocalDay | null {
  if (task.repeat === null) {
    return task.dueDate
  }

  let occurrence = currentOccurrence(task.repeat, now)
  if (toLocalDay(occurrence) < toLocalDay(new Date(task.createdAt))) {
    return null
  }

  if (!isComplete(task, now)) {
    while (task.skippedDays.includes(toLocalDay(occurrence))) {
      occurrence = nextOccurrence(task.repeat, occurrence)
    }
  }
  return toLocalDay(occurrence)
}

/**
 * Whether the task has an occurrence to pass over: it repeats, is still to do,
 * and is due on a day. A one-off has no next day to move on to, and a done
 * occurrence was not skipped.
 */
export function canSkipOccurrence(task: Task, now: Date = new Date()): boolean {
  return task.repeat !== null && !isDeleted(task) && !isComplete(task, now) && dueDay(task, now) !== null
}

/**
 * Passes over the occurrence the task is due on, so it is due on the rule's next
 * day instead — without being done, so nothing is recorded or earned for it.
 * Skipping again passes over that one too. Ticking the task off afterwards is
 * doing the occurrence in play after all (see `Task.skippedDays`).
 *
 * Returns a new task; the one passed in is never modified.
 */
export function skipOccurrence(task: Task, now: Date = new Date()): Task {
  const day = dueDay(task, now)
  if (!canSkipOccurrence(task, now) || day === null) {
    return task
  }

  return { ...task, skippedDays: [...task.skippedDays, day].sort() }
}

/** Due on a day already gone, and still not done. */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  return due !== null && due < toLocalDay(now) && !isComplete(task, now)
}

/** The overdue tasks and everything else, the two runs a list is drawn in. */
export interface OverdueSplit {
  readonly overdue: readonly Task[]
  readonly rest: readonly Task[]
}

/**
 * The tasks split into the overdue ones and the rest, so a list can draw the
 * overdue under a heading of their own. Each run keeps the order it was given,
 * so tasks sorted by `sortForDisplay` — which already floats the overdue to the
 * top — stay sorted inside their run.
 *
 * Nothing is rewritten when the day turns: which run a task is in follows from
 * `now`, so a page left open moves a task that has just fallen behind on its
 * next render.
 */
export function splitOverdue(tasks: readonly Task[], now: Date = new Date()): OverdueSplit {
  return {
    overdue: tasks.filter((task) => isOverdue(task, now)),
    rest: tasks.filter((task) => !isOverdue(task, now)),
  }
}

/**
 * Whether the task belongs in the list for a period — Today, Week or Month —
 * the periods the progress bars count, a week running Monday to Sunday.
 *
 * To do, it belongs when it is due by the period's last day, overdue included —
 * a day missed does not let a task drop out of sight, and whatever is in Today
 * is in Week and Month too. A task still to do with no day is in none of them:
 * nothing asks for it on any particular day.
 *
 * Done, it stays when it was due inside the period, whenever it was finished,
 * and otherwise when it was finished inside the period, so ticking something
 * off does not make it vanish — that is what keeps an overdue task finished
 * today in today's list, and what puts a task with no day there, the day it was
 * finished being the only day it has. A task finished ahead of a later period
 * stays in that period.
 *
 * A repeating task is in on its occurrence in play, so a Friday task joins the
 * week on Friday: ahead of that the only occurrence there is to show is last
 * week's.
 */
export function isInPeriod(task: Task, period: Period, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  if (isDeleted(task)) {
    return false
  }

  const last = lastDayOf(period, now)
  if (!isComplete(task, now)) {
    return due !== null && due <= last
  }

  const first = toLocalDay(periodRange(period, now).start)
  if (due !== null && due >= first) {
    return due <= last
  }

  const finished = task.completedAt === null ? null : toLocalDay(new Date(task.completedAt))
  return finished !== null && finished >= first && finished <= last
}

/**
 * The last day of the period `now` falls in — today, this Sunday, the end of
 * this month — and so the day a task added to that period's list starts on.
 */
export function lastDayOf(period: Period, now: Date = new Date()): LocalDay {
  return offsetDay(toLocalDay(periodRange(period, now).end), -1)
}

/**
 * The day "Next week" sets: the Sunday that closes next week. Weeks run Monday
 * to Sunday, as ./progress counts them, so from any day of this week — Sunday
 * included — it is the Sunday after the coming Monday.
 */
export function nextWeekDueDay(now: Date = new Date()): LocalDay {
  return offsetDay(lastDayOf('week', now), 7)
}
