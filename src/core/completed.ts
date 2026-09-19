/**
 * How long ago a done task was finished, in the spans a list of done tasks is
 * divided into. The spans count back from today in local days, so they follow
 * the owner's calendar the way due dates do — and a page left open overnight
 * moves yesterday's work along on its next render without anything rewriting it.
 */

import { offsetDay, toLocalDay } from './day'
import { isComplete, type Task } from './task'

/**
 * Today, yesterday, the rest of the seven days to today, the rest of the thirty,
 * and anything before. Each span leaves out the ones before it, so a task is in
 * exactly one.
 */
export type CompletionSpan = 'today' | 'yesterday' | 'last7Days' | 'last30Days' | 'earlier'

/** Most recent first: the order the spans are shown in. */
export const COMPLETION_SPANS: readonly CompletionSpan[] = ['today', 'yesterday', 'last7Days', 'last30Days', 'earlier']

/**
 * Which span the task was finished in, or null while it is not done as of `now`
 * — a repeating task is only done for its current occurrence (`isComplete`).
 *
 * A completion stamped later than today, by a device whose clock ran ahead,
 * counts as today's. A done task with no time on it is from before anything
 * could say when, so it is `earlier`.
 */
export function completionSpan(task: Task, now: Date = new Date()): CompletionSpan | null {
  if (!isComplete(task, now)) return null
  if (task.completedAt === null) return 'earlier'

  const day = toLocalDay(new Date(task.completedAt))
  const today = toLocalDay(now)
  if (day >= today) return 'today'
  if (day === offsetDay(today, -1)) return 'yesterday'
  if (day >= offsetDay(today, -6)) return 'last7Days'
  if (day >= offsetDay(today, -29)) return 'last30Days'
  return 'earlier'
}

/** A run of tasks finished in one span, or of the tasks still to do, under none. */
export interface CompletionGroup {
  readonly span: CompletionSpan | null
  readonly tasks: readonly Task[]
}

/**
 * The tasks divided by when they were finished: the ones still to do first, then
 * each span that holds any, most recent first. Within each the order given is
 * kept, so tasks sorted by `order` stay sorted inside their groups.
 */
export function groupByCompletion(tasks: readonly Task[], now: Date = new Date()): CompletionGroup[] {
  const spans = tasks.map((task) => completionSpan(task, now))

  return [null, ...COMPLETION_SPANS]
    .map((span) => ({ span, tasks: tasks.filter((_, index) => spans[index] === span) }))
    .filter((group) => group.tasks.length > 0)
}
