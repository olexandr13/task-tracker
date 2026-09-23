/**
 * Whether a task is marked urgent.
 *
 * Urgent is a label, not a ranking: a task is urgent or it is not. Marking it
 * floats it to the top of its run of tasks still to do — the overdue, or the
 * rest (`sortForDisplay` in ./order); it earns nothing. Most tasks are not
 * urgent until one is marked.
 */

import type { Task } from './task'

/**
 * Marks the task urgent, or clears the mark. Returns a new task; the one passed
 * in is never modified.
 */
export function setUrgent(task: Task, urgent: boolean): Task {
  return urgent === task.urgent ? task : { ...task, urgent }
}

export function isUrgent(task: Task): boolean {
  return task.urgent
}
