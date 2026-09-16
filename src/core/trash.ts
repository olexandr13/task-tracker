/**
 * The trash: where a deleted task waits before it is gone for good.
 *
 * Deleting is reversible twice over — an undo that lasts seconds, and this,
 * which lasts a day. Nothing sweeps the trash on a schedule. Expiry is derived
 * from `deletedAt` and the moment being asked about, the same way
 * `currentOccurrence` derives whether a repeating task is due, so a page left
 * open past the boundary stops showing an expired task on its next render and
 * storage catches up the next time it is written.
 */

import { isDeleted, type Task } from './task'

/** How long a deleted task stays in the trash before it is purged. */
export const TRASH_RETENTION_MS = 24 * 60 * 60 * 1000

/**
 * How long this task has left before it is purged, in milliseconds. Zero once
 * the window has run out, and zero for a task that is not in the trash at all.
 */
export function msUntilPurge(task: Task, now: Date = new Date()): number {
  if (task.deletedAt === null) {
    return 0
  }

  const deadline = new Date(task.deletedAt).getTime() + TRASH_RETENTION_MS
  return Math.max(0, deadline - now.getTime())
}

/** Whether the task has been in the trash for at least as long as it is kept. */
export function isExpired(task: Task, now: Date = new Date()): boolean {
  return isDeleted(task) && msUntilPurge(task, now) === 0
}

/** Everything worth keeping: live tasks, plus trashed ones still inside the window. */
export function purgeExpired(tasks: readonly Task[], now: Date = new Date()): Task[] {
  return tasks.filter((task) => !isExpired(task, now))
}

/** The tasks the app is actually about: the ones not in the trash. */
export function liveTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => !isDeleted(task))
}

/**
 * What the trash shows, most recently deleted first. Expired tasks are left out
 * even where storage still holds them, so what is on screen never outlives the
 * rule.
 */
export function trashedTasks(tasks: readonly Task[], now: Date = new Date()): Task[] {
  return tasks
    .filter((task) => isDeleted(task) && !isExpired(task, now))
    .sort((a, b) => deletedAtTime(b) - deletedAtTime(a))
}

function deletedAtTime(task: Task): number {
  return task.deletedAt === null ? 0 : new Date(task.deletedAt).getTime()
}
