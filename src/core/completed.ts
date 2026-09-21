/**
 * How long ago a done task was finished, in the spans a list of done tasks is
 * divided into. The spans count back from today in local days, so they follow
 * the owner's calendar the way due dates do — and a page left open overnight
 * moves yesterday's work along on its next render without anything rewriting it.
 *
 * Tasks uses these; other views keep one run of done work.
 */

import { offsetDay, toLocalDay, type LocalDay } from './day'
import { isComplete, type Task } from './task'

/**
 * Today, yesterday, the rest of the seven days to today, the rest of the thirty
 * days, and anything before.
 */
export type CompletionSpan = 'today' | 'yesterday' | 'last7Days' | 'last30Days' | 'earlier'

/** A span with a first day. `earlier` has none: it holds whatever the others leave. */
export type BoundedSpan = Exclude<CompletionSpan, 'earlier'>

/**
 * The spans a list is divided into, most recent first, each starting on an
 * earlier day than the one before. Each leaves out the ones before it, and
 * `earlier` follows the last, so a done task is in exactly one.
 */
export type CompletionSpans = readonly BoundedSpan[]

/** For every done task there is: windows rolling back from today. */
export const ROLLING_SPANS: CompletionSpans = ['today', 'yesterday', 'last7Days', 'last30Days']

/**
 * Which of `spans` the task was finished in — `earlier` when before all of them —
 * or null while it is not done as of `now`; a repeating task is only done for its
 * current occurrence (`isComplete`).
 *
 * A completion stamped later than today, by a device whose clock ran ahead,
 * counts as today's. A done task with no time on it is from before anything
 * could say when, so it is `earlier`.
 */
export function completionSpan(task: Task, spans: CompletionSpans, now: Date = new Date()): CompletionSpan | null {
  if (!isComplete(task, now)) return null
  if (task.completedAt === null) return 'earlier'

  const day = toLocalDay(new Date(task.completedAt))
  return spans.find((span) => day >= firstDayOf(span, now)) ?? 'earlier'
}

/** The day a span starts on. */
function firstDayOf(span: BoundedSpan, now: Date): LocalDay {
  const today = toLocalDay(now)

  switch (span) {
    case 'today':
      return today
    case 'yesterday':
      return offsetDay(today, -1)
    case 'last7Days':
      return offsetDay(today, -6)
    case 'last30Days':
      return offsetDay(today, -29)
  }
}

/** A run of tasks finished in one span, or of the tasks still to do, under none. */
export interface CompletionGroup {
  readonly span: CompletionSpan | null
  readonly tasks: readonly Task[]
}

/**
 * The tasks divided by when they were finished: the ones still to do first, then
 * each of `spans` that holds any, most recent first, then `earlier`. Within each
 * the order given is kept, so tasks sorted by `order` stay sorted inside their
 * groups.
 */
export function groupByCompletion(
  tasks: readonly Task[],
  spans: CompletionSpans,
  now: Date = new Date(),
): CompletionGroup[] {
  const found = tasks.map((task) => completionSpan(task, spans, now))

  return [null, ...spans, 'earlier' as const]
    .map((span) => ({ span, tasks: tasks.filter((_, index) => found[index] === span) }))
    .filter((group) => group.tasks.length > 0)
}
