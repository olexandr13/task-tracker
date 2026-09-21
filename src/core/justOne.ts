/**
 * Picking one open task when the owner wants a single next step.
 *
 * Pure ranking over tasks already in play (Today's list, typically): checklist
 * size, time goal, reward, habit, and recent completion momentum. Urgent is not
 * a signal — the mark is the owner's, not a measure of how hard the task feels.
 */

import { offsetDay, toLocalDay } from './day'
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
