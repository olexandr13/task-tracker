/**
 * Goals: what a task is done for.
 *
 * A goal is **a record of its own** — "Run a half marathon", "Ship the app" —
 * and a task serves **one** of them or none. Where a list (./list) says where a
 * task lives and a tag (./tag) what it is about, a goal says what it brings
 * closer, which is why a goal has something neither has: **progress**, the
 * share of the tasks serving it that are done.
 *
 * One goal at a time keeps that share honest: a task counts once, towards the
 * one thing it is for. A task names its goal by id, as it names its list, so a
 * goal is renamed without one task being rewritten.
 *
 * Not the time goal a task can ask for (./timeLog): that is a length of time,
 * this is something the work adds up to.
 */

import { isComplete, type Task } from './task'

export type GoalId = string

export interface Goal {
  readonly id: GoalId
  /** What it is called, as it was written: a goal is a phrase more often than a word. */
  readonly name: string
  /** ISO 8601 timestamp. */
  readonly createdAt: string
  /**
   * Where it sits among the goals: lower comes first. Its own number rather
   * than its place in an array, so records from two devices merge one by one,
   * as a list's do (./list).
   */
  readonly order: number
}

/** The gap left between neighbours, as lists have one. */
const GOAL_ORDER_STEP = 1024

/** As long a name as a goal is given room for on screen: a short phrase. */
export const MAX_GOAL_NAME_LENGTH = 60

export class InvalidGoalNameError extends Error {
  constructor(name: string) {
    super(`"${name}" is not a goal name: a goal needs a name, on one line, of at most ${String(MAX_GOAL_NAME_LENGTH)} characters.`)
    this.name = 'InvalidGoalNameError'
  }
}

/**
 * Whether `name` can name a goal: something other than space, on one line, and
 * short enough to read. Anything else is allowed — the address names a goal by
 * its id, never by its name.
 */
export function isGoalName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_GOAL_NAME_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** The stored form of a goal name: trimmed, with the spaces inside it squeezed to one. */
export function normalizeGoalName(name: string): string {
  const trimmed = name.trim().replace(/\s+/gu, ' ')
  if (!isGoalName(trimmed)) {
    throw new InvalidGoalNameError(name)
  }

  return trimmed
}

/** Whether two names are the same goal's. Case does not make another goal, as with lists. */
export function sameGoalName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/** A goal of the given name. `appendGoal` is what puts it at the end of the others. */
export function createGoal(name: string, now: Date = new Date()): Goal {
  return {
    id: crypto.randomUUID(),
    name: normalizeGoalName(name),
    createdAt: now.toISOString(),
    order: 0,
  }
}

/** Renames a goal. Nothing about its tasks changes: they serve it by its id. */
export function renameGoal(goal: Goal, name: string): Goal {
  const renamed = normalizeGoalName(name)
  return renamed === goal.name ? goal : { ...goal, name: renamed }
}

/** Adds a goal at the end of the ones there are. Returns a new array. */
export function appendGoal(goals: readonly Goal[], goal: Goal): Goal[] {
  const order = goals.length === 0 ? 0 : Math.max(...goals.map((existing) => existing.order)) + GOAL_ORDER_STEP

  return [...goals, { ...goal, order }]
}

/**
 * The goals in the order they are shown: their own, then age, then id, so two
 * merged devices never leave it to chance. Returns a new array.
 */
export function sortGoals(goals: readonly Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
    if (a.id === b.id) return 0
    return a.id < b.id ? -1 : 1
  })
}

export function findGoal(goals: readonly Goal[], id: GoalId): Goal | null {
  return goals.find((goal) => goal.id === id) ?? null
}

/** Whether any goal is called this already, whatever its case — `except` aside, which is its own. */
export function isGoalNameTaken(goals: readonly Goal[], name: string, except: GoalId | null = null): boolean {
  const trimmed = name.trim().replace(/\s+/gu, ' ')
  return goals.some((goal) => goal.id !== except && sameGoalName(goal.name, trimmed))
}

/**
 * The goal the task serves, or null for none. A task naming a goal that is not
 * among `goals` — deleted on another device, say — serves none.
 */
export function goalOf(task: Task, goals: readonly Goal[]): Goal | null {
  return task.goalId === null ? null : findGoal(goals, task.goalId)
}

/** Whether the task serves this very goal. */
export function servesGoal(task: Task, id: GoalId): boolean {
  return task.goalId === id
}

/**
 * Links the task to a goal, or to none with null. Nothing else about it
 * changes: a task is the same task whatever it is for.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function linkToGoal(task: Task, id: GoalId | null): Task {
  return task.goalId === id ? task : { ...task, goalId: id }
}

/**
 * Unlinks every task from a goal, tasks in the trash too, so restoring one never
 * links it to a goal that has gone. The tasks themselves stay. Tasks serving
 * other goals are handed back as they were.
 *
 * Returns a new array; the one passed in is never modified.
 */
export function clearGoal(tasks: readonly Task[], id: GoalId): Task[] {
  return tasks.map((task) => (servesGoal(task, id) ? linkToGoal(task, null) : task))
}

/** How far a goal has got: of the tasks serving it, how many are done. */
export interface GoalProgress {
  readonly done: number
  readonly total: number
}

/**
 * How far a goal has got as of `now`: the live tasks serving it, and how many of
 * them are done — a repeating one for its current occurrence, as everywhere else.
 * Pass live tasks: what is in the trash is not serving anything.
 *
 * `unheldDone` is the tasks serving it that are not held on this device —
 * history (STORE-55), every one of them done — which the caller counts some
 * other way. They are done tasks like any other, so they count towards both.
 */
export function goalProgress(id: GoalId, tasks: readonly Task[], now: Date = new Date(), unheldDone = 0): GoalProgress {
  const serving = tasks.filter((task) => servesGoal(task, id))
  const done = serving.filter((task) => isComplete(task, now)).length

  return { done: done + unheldDone, total: serving.length + unheldDone }
}

/**
 * The share of a goal's tasks that are done, as a whole percent rounded down —
 * so 100 is said only once every one is — or null for a goal no task serves yet,
 * which is not 0% of the way anywhere, nor all the way.
 */
export function goalPercent(progress: GoalProgress): number | null {
  if (progress.total === 0) return null
  return Math.floor((progress.done / progress.total) * 100)
}

/** Whether every task serving the goal is done — and there is at least one. */
export function isGoalReached(progress: GoalProgress): boolean {
  return progress.total > 0 && progress.done === progress.total
}

export interface GoalSummary extends GoalProgress {
  readonly goal: Goal
}

/**
 * Every goal, in the order they are shown, with how far it has got as of `now`.
 * `unheldDone` says, by goal, how many of its tasks are history not held here;
 * a goal it does not name has none counted.
 */
export function summarizeGoals(
  goals: readonly Goal[],
  tasks: readonly Task[],
  now: Date = new Date(),
  unheldDone: ReadonlyMap<GoalId, number> = new Map(),
): GoalSummary[] {
  return sortGoals(goals).map((goal) => ({ goal, ...goalProgress(goal.id, tasks, now, unheldDone.get(goal.id) ?? 0) }))
}
