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
 * Whether the task belongs in the list for a period — Today, Week or Month —
 * the periods the progress bars count, a week running Monday to Sunday.
 *
 * To do, it belongs when it is due by the period's last day, overdue included —
 * a day missed does not let a task drop out of sight, and whatever is in Today
 * is in Week and Month too. Done, it stays when it was due inside the period,
 * whenever it was finished, and when it was overdue and finished inside the
 * period, so ticking something off does not make it vanish. A task finished
 * ahead of a later period stays in that period, and a task with no day at all
 * is never in one, however recently it was touched.
 *
 * A repeating task is in on its occurrence in play, so a Friday task joins the
 * week on Friday: ahead of that the only occurrence there is to show is last
 * week's.
 */
export function isInPeriod(task: Task, period: Period, now: Date = new Date()): boolean {
  const due = dueDay(task, now)
  if (isDeleted(task) || due === null) {
    return false
  }

  const last = lastDayOf(period, now)
  if (!isComplete(task, now)) {
    return due <= last
  }

  const first = toLocalDay(periodRange(period, now).start)
  if (due >= first) {
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
