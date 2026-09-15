/**
 * The rules of a task.
 *
 * This layer is pure TypeScript: no React, no browser APIs, no saving or loading.
 * Everything here is a pure function over plain data, so it stays testable and
 * reusable if the app ever grows a second front end. See CLAUDE.md.
 */

export type TaskId = string

export type TaskStatus = 'todo' | 'done'

export interface Task {
  readonly id: TaskId
  readonly title: string
  readonly status: TaskStatus
  /** ISO 8601 timestamp. */
  readonly createdAt: string
  /** ISO 8601 timestamp, or null while the task is still todo. */
  readonly completedAt: string | null
}

export class EmptyTitleError extends Error {
  constructor() {
    super('A task needs a title.')
    this.name = 'EmptyTitleError'
  }
}

/**
 * `now` is injectable so tests stay deterministic, and so future rules that care
 * about time (streaks, daily quotas) have a seam to hook into.
 */
export function createTask(title: string, now: Date = new Date()): Task {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    throw new EmptyTitleError()
  }

  return {
    id: crypto.randomUUID(),
    title: trimmed,
    status: 'todo',
    createdAt: now.toISOString(),
    completedAt: null,
  }
}

/** Returns a new task; the one passed in is never modified. */
export function completeTask(task: Task, now: Date = new Date()): Task {
  if (task.status === 'done') {
    return task
  }

  return { ...task, status: 'done', completedAt: now.toISOString() }
}

export function isComplete(task: Task): boolean {
  return task.status === 'done'
}
