/**
 * How long ago a done task was finished, in the spans a list of done tasks is
 * divided into. The spans count back from today in local days, so they follow
 * the owner's calendar the way due dates do — and a page left open overnight
 * moves yesterday's work along on its next render without anything rewriting it.
 *
 * Tasks, the Inbox, lists and tags use these; Today, Week and Month keep one run
 * of done work.
 */

import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
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

  return spanOfDay(toLocalDay(new Date(task.completedAt)), spans, now)
}

/** Which of `spans` a local day falls in, or `earlier` when it is before all of them. */
function spanOfDay(day: LocalDay, spans: CompletionSpans, now: Date): CompletionSpan {
  return spans.find((span) => day >= firstDayOf(span, now)) ?? 'earlier'
}

/** The day a span starts on, or null for `earlier`, which reaches back to before anything was done. */
export function spanStart(span: CompletionSpan, now: Date = new Date()): LocalDay | null {
  return span === 'earlier' ? null : firstDayOf(span, now)
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

/**
 * A day a repeating task was done on before the occurrence in play (TASK-75):
 * finished work all the same, though the task itself has moved on to the
 * occurrence still to do — or, done again, stands for its latest day alone.
 */
export interface PastCompletion {
  readonly task: Task
  readonly day: LocalDay
}

/**
 * The days a repeating task was done on (RPT-27) that its own box no longer
 * speaks for, latest first: every one of them bar the day of the completion that
 * has it reading as done now. Days after today are left out, as a habit leaves
 * them out (HAB-13). A task that happens once has none — it was finished once,
 * and is its own record — and nor has one in the trash.
 */
export function pastCompletions(task: Task, now: Date = new Date()): PastCompletion[] {
  if (task.repeat === null || task.deletedAt !== null) return []

  const today = toLocalDay(now)
  const current = isComplete(task, now) && task.completedAt !== null ? toLocalDay(new Date(task.completedAt)) : null
  return [...new Set(task.doneDays)]
    .filter((day) => day <= today && day !== current)
    .sort()
    .reverse()
    .map((day) => ({ task, day }))
}

/**
 * The past completions of `tasks` (`pastCompletions`) divided among `spans` by
 * the day each was done on, `earlier` holding whatever is before them all. Each
 * span's are latest first, and those of one day keep the order the tasks were
 * given in.
 */
export function pastCompletionsBySpan(
  tasks: readonly Task[],
  spans: CompletionSpans,
  now: Date = new Date(),
): ReadonlyMap<CompletionSpan, readonly PastCompletion[]> {
  const latestFirst = tasks
    .flatMap((task) => pastCompletions(task, now))
    .sort((a, b) => (a.day === b.day ? 0 : a.day > b.day ? -1 : 1))

  const bySpan = new Map<CompletionSpan, PastCompletion[]>()
  for (const past of latestFirst) {
    const span = spanOfDay(past.day, spans, now)
    const found = bySpan.get(span)
    if (found === undefined) bySpan.set(span, [past])
    else found.push(past)
  }
  return bySpan
}

/**
 * One row of a span of done work: a done task as it stands, with `day` null, or
 * a day a repeating task was done on before the occurrence in play (TASK-75).
 */
export interface DoneWork {
  readonly task: Task
  readonly day: LocalDay | null
}

/**
 * A span's done tasks and its past completions as one run, latest first
 * (TASK-70). Both are taken latest first, as `sortForDisplay` and
 * `pastCompletionsBySpan` leave them. A past day has no moment of its own and
 * counts from its start, as a day marked on the Habits page is stamped
 * (HAB-16), so it follows the work finished later that day; a done task with
 * nothing saying when follows everything.
 */
export function doneWork(done: readonly Task[], past: readonly PastCompletion[]): DoneWork[] {
  const work: DoneWork[] = []
  let next = 0
  for (const task of done) {
    const at = task.completedAt === null ? -Infinity : Date.parse(task.completedAt)
    while (next < past.length && startOfLocalDay(past[next].day).getTime() > at) {
      work.push(past[next])
      next += 1
    }
    work.push({ task, day: null })
  }
  return [...work, ...past.slice(next)]
}
