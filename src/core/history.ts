/**
 * History: done work that nothing on screen asks for until a span of done tasks
 * reaching back to it is opened.
 *
 * Every period a list, a bar or a bonus counts — today, this week, this month —
 * starts on or after the first day of this week or of this month, and every
 * day a case counts — today, yesterday, last week — on or after the first day
 * of last week (CHST-10). A task done once and for all before the first of
 * those, and not due on or after it, is counted by none of them: it is only
 * ever looked at under a span of done work (TASK-74). Leaving it out of what is loaded when the app opens
 * keeps that load the size of the work in play rather than of everything ever
 * done (STORE-55).
 */

import { spanStart, type CompletionSpan } from './completed'
import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { periodRange } from './progress'
import type { Task } from './task'

/**
 * The first day of last week or of this month, whichever comes first: done
 * work finished before it can be history. Last week, not this one, because
 * Weekly and the Drop count the tasks finished then, with points or without
 * (CHST-10), and a task without points is only in the tasks.
 */
export function historyStart(now: Date = new Date()): LocalDay {
  const week = offsetDay(toLocalDay(periodRange('week', now).start), -7)
  const month = toLocalDay(periodRange('month', now).start)
  return week < month ? week : month
}

/**
 * Whether the task is history as of `start` (`historyStart`): one that happens
 * once, is done and not in the trash, was finished before `start` — or before
 * anything said when — and is not due on or after it. Everything else is held
 * from the moment the app opens: what is still to do, what repeats, the trash,
 * and what was finished or is due from `start` on.
 */
export function isHistory(task: Task, start: LocalDay): boolean {
  if (task.repeat !== null || task.deletedAt !== null || task.status !== 'done') return false
  if (task.dueDate !== null && task.dueDate >= start) return false
  return task.completedAt === null || new Date(task.completedAt) < startOfLocalDay(start)
}

/**
 * Whether every task a span of done work could hold is held, when every task
 * finished on or after `heldSince` is — or every task at all is, with null. A
 * span starting before `heldSince` may hold history not loaded yet, and
 * `earlier` reaches back to the start of everything.
 */
export function isSpanHeld(span: CompletionSpan, heldSince: LocalDay | null, now: Date = new Date()): boolean {
  if (heldSince === null) return true
  const start = spanStart(span, now)
  return start !== null && start >= heldSince
}
