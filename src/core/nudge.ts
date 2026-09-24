/**
 * The nudge: when nothing has been finished for a while, the app says so and
 * points at the one task most worth doing, rather than leaving the owner to
 * choose all over again — the choosing being where the hours go.
 *
 * Pure derivation over the tasks and a few moments in time. Nothing here knows
 * how a nudge is shown, and nothing counts down: a quiet stretch is measured
 * from when work last happened, so a page left open, a refresh, or a device
 * asleep for an hour all read the same.
 */

import { sortForDisplay } from './order'
import { isComplete, type Task, type TaskId } from './task'

/** How long of nothing finished before the app says something, in hours. */
export type QuietHours = 1 | 2 | 3 | 4

/** The spans that can be chosen, shortest first. */
export const QUIET_HOURS: readonly QuietHours[] = [1, 2, 3, 4]

/** A couple of hours: long enough to be working through something, short enough to catch drift. */
export const DEFAULT_QUIET_HOURS: QuietHours = 2

export function isQuietHours(value: unknown): value is QuietHours {
  return QUIET_HOURS.includes(value as QuietHours)
}

const HOUR_MS = 60 * 60 * 1000

/**
 * When work last happened among these tasks, or null when none of them has ever
 * been finished. Pass the tasks in play; a repeating task's `completedAt` is its
 * latest completion, which is exactly what this asks.
 *
 * A stamp from the future — a device whose clock ran ahead — counts as now:
 * work ahead of the clock is work just done, not a quiet stretch of hours.
 */
export function lastFinishedAt(tasks: readonly Task[], now: Date = new Date()): Date | null {
  let latest: number | null = null

  for (const task of tasks) {
    if (task.completedAt === null) continue
    const at = Date.parse(task.completedAt)
    if (Number.isNaN(at)) continue
    if (latest === null || at > latest) latest = at
  }

  return latest === null ? null : new Date(Math.min(latest, now.getTime()))
}

/** The moments a quiet stretch is measured from. */
export interface QuietInput {
  /** When work last happened, or null when nothing has ever been finished. */
  readonly finishedAt: Date | null
  /** When this device last nudged, or null when it has not. */
  readonly nudgedAt: Date | null
  /** When this device started watching — the screen opening. */
  readonly watchingSince: Date
}

/**
 * When the quiet began: the last thing finished, or — with nothing ever
 * finished — the moment this device started watching, since an account that has
 * only just begun is not hours behind.
 *
 * A nudge already shown starts the quiet again from itself, so one quiet stretch
 * is nudged once and then once more each span it runs on, rather than on every
 * tick and every refresh.
 */
export function quietSince({ finishedAt, nudgedAt, watchingSince }: QuietInput): Date {
  const began = finishedAt ?? watchingSince
  return nudgedAt !== null && nudgedAt > began ? nudgedAt : began
}

/** How long the quiet has run at `now`, in whole milliseconds, never below zero. */
export function quietFor(input: QuietInput, now: Date = new Date()): number {
  return Math.max(0, now.getTime() - quietSince(input).getTime())
}

/** Whether the quiet has run the chosen span, and so is worth saying something about. */
export function isQuietEnough(input: QuietInput, hours: QuietHours, now: Date = new Date()): boolean {
  return quietFor(input, now) >= hours * HOUR_MS
}

/**
 * The task a nudge points at: the one its list already leads with — overdue
 * first, then urgent, then where the owner put it (`sortForDisplay`) — among
 * those still to do.
 *
 * Importance is read from the list rather than measured afresh: the top of
 * Today is what the app has been saying matters all along, and a nudge that
 * disagreed with the screen behind it would only be one more thing to weigh.
 * This is the other end of Procrastination mode, which picks the *easiest*
 * open task (`pickJustOne`) because there the point is to start at all.
 *
 * Pass the tasks in play — Today's, typically, which holds the overdue too.
 * Null when there is nothing left to do, which is no time to be nudged.
 */
export function pickMostImportant(tasks: readonly Task[], now: Date = new Date()): Task | null {
  const open = tasks.filter((task) => !isComplete(task, now))
  if (open.length === 0) return null

  return sortForDisplay(open, now)[0] ?? null
}

/**
 * A nudge that has fired and not yet been answered — kept on the device so a
 * remount, a refresh or a change of page does not lose a notice that has
 * already spent its quiet stretch (NUDGE-6).
 */
export interface StandingNudge {
  readonly taskId: TaskId
  readonly quietHours: QuietHours
}

/** What a nudge has to say. */
export interface Nudge {
  readonly taskId: TaskId
  readonly title: string
  /** The span that had passed when it fired, so the notice can name it. */
  readonly quietHours: QuietHours
}

/**
 * The nudge to show at `now`, or null when there is none: the quiet is not long
 * enough yet, or there is nothing left to do.
 */
export function findNudge(
  tasks: readonly Task[],
  quiet: QuietInput,
  hours: QuietHours,
  now: Date = new Date(),
): Nudge | null {
  if (!isQuietEnough(quiet, hours, now)) return null

  const task = pickMostImportant(tasks, now)
  return task === null ? null : { taskId: task.id, title: task.title, quietHours: hours }
}

/**
 * The standing nudge read against the tasks as they are now, or null when it
 * has nothing left to say: its task is done or gone from the list, or work has
 * happened since it fired — "nothing done" being the whole of what it said.
 *
 * Derived rather than cleared at the moment it stops being true, so however the
 * task is finished — its box, its checklist, another device — the notice
 * follows. The title is read from the task each time, so a renamed task reads
 * right.
 */
export function settleNudge(
  standing: StandingNudge | null,
  tasks: readonly Task[],
  nudgedAt: Date | null,
  now: Date = new Date(),
): Nudge | null {
  if (standing === null) return null

  const task = tasks.find((candidate) => candidate.id === standing.taskId)
  if (task === undefined || isComplete(task, now)) return null

  const finishedAt = lastFinishedAt(tasks, now)
  if (nudgedAt !== null && finishedAt !== null && finishedAt > nudgedAt) return null

  return { taskId: task.id, title: task.title, quietHours: standing.quietHours }
}
