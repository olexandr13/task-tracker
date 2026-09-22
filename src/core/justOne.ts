/**
 * Procrastination mode: picking one open task when the owner wants a single
 * next step, and how the mode stands as that task is done or moves on.
 *
 * Pure ranking over tasks already in play (Today's list, typically): checklist
 * size, time goal, reward, habit, and recent completion momentum. Urgent is not
 * a signal — the mark is the owner's, not a measure of how hard the task feels.
 */

import { offsetDay, toLocalDay, type LocalDay } from './day'
import { isHabit } from './habit'
import { compareOrder } from './order'
import { countSubtasks, isComplete, type Task, type TaskId } from './task'

/** Local days from today back through six earlier ones — a rolling week. */
function recentWindowStart(now: Date): string {
  return offsetDay(toLocalDay(now), -6)
}

/** How many of the task's done days fall in the rolling last seven local days. */
export function recentDoneCount(task: Task, now: Date = new Date()): number {
  const today = toLocalDay(now)
  const start = recentWindowStart(now)
  return task.doneDays.filter((day) => day >= start && day <= today).length
}

/** Open checklist items still to tick as of `now`. */
function openChecklistCount(task: Task, now: Date): number {
  const { done, total } = countSubtasks(task, now)
  return total - done
}

/**
 * Easier first: fewer open checklist items, shorter time goal (unset is harder
 * than any set goal), lower reward, habit over non-habit, more recent done days,
 * then list order.
 */
function compareJustOne(a: Task, b: Task, now: Date): number {
  const aOpen = openChecklistCount(a, now)
  const bOpen = openChecklistCount(b, now)
  if (aOpen !== bOpen) return aOpen - bOpen

  const aTime = a.timeGoal ?? Number.POSITIVE_INFINITY
  const bTime = b.timeGoal ?? Number.POSITIVE_INFINITY
  if (aTime !== bTime) return aTime - bTime

  const aReward = a.reward ?? 0
  const bReward = b.reward ?? 0
  if (aReward !== bReward) return aReward - bReward

  const aHabit = Number(isHabit(a))
  const bHabit = Number(isHabit(b))
  if (aHabit !== bHabit) return bHabit - aHabit

  const aRecent = recentDoneCount(a, now)
  const bRecent = recentDoneCount(b, now)
  if (aRecent !== bRecent) return bRecent - aRecent

  return compareOrder(a, b)
}

/**
 * Puts the focused task first so a finished win stays above the dimmed rows
 * instead of sinking with the other done work (JUST-5).
 */
export function pinFocusedFirst(tasks: readonly Task[], focusId: TaskId | null): Task[] {
  if (focusId === null) return [...tasks]
  const focused = tasks.find((task) => task.id === focusId)
  if (focused === undefined) return [...tasks]
  return [focused, ...tasks.filter((task) => task.id !== focusId)]
}

/**
 * The easiest open task among `tasks`, or null when none are still to do.
 * Pass tasks already belonging to Today (or whatever set is in play). When
 * `excludeId` is set and another open task exists, that id is skipped so
 * "Another" does not land on the same one.
 */
export function pickJustOne(
  tasks: readonly Task[],
  now: Date = new Date(),
  excludeId: TaskId | null = null,
): Task | null {
  const open = tasks.filter((task) => !isComplete(task, now))
  if (open.length === 0) return null

  const pool =
    excludeId !== null && open.some((task) => task.id !== excludeId)
      ? open.filter((task) => task.id !== excludeId)
      : open

  return [...pool].sort((a, b) => compareJustOne(a, b, now))[0] ?? null
}

/**
 * Procrastination mode on Today: off; on with nothing picked (resting); focused
 * on one task; or that task just won. Every phase but off belongs to the local
 * day it was set on (JUST-10).
 */
export type ProcrastinationState =
  | { readonly phase: 'off' }
  | { readonly phase: 'idle'; readonly day: LocalDay }
  | { readonly phase: 'focus' | 'won'; readonly taskId: TaskId; readonly day: LocalDay }

export const PROCRASTINATION_OFF: ProcrastinationState = { phase: 'off' }

/**
 * How the mode stands against the day and Today's tasks at `now`:
 *
 * - a mode from an earlier day is off (JUST-10);
 * - a focused task that is done is a win (JUST-7);
 * - a focused or won task no longer on Today leaves the mode resting (JUST-7).
 *
 * `today` is null while the tasks are still loading: an empty list then is not a
 * task gone, so only the day is checked (JUST-10). Derived rather than stored at
 * the moment it happens, so however a task is finished or moved — its box, its
 * checklist, another device — the mode follows. Returns `state` itself when
 * nothing changes.
 */
export function settleProcrastination(
  state: ProcrastinationState,
  today: readonly Task[] | null,
  now: Date = new Date(),
): ProcrastinationState {
  if (state.phase === 'off') return state
  if (state.day !== toLocalDay(now)) return PROCRASTINATION_OFF
  if (today === null || state.phase === 'idle') return state

  const task = today.find((candidate) => candidate.id === state.taskId)
  if (task === undefined) return { phase: 'idle', day: state.day }
  if (state.phase === 'focus' && isComplete(task, now)) return { phase: 'won', taskId: task.id, day: state.day }
  return state
}
