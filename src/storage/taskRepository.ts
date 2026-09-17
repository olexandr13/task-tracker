import type { Task, TaskId } from '../core'

/** What one change to the list comes to, task by task. */
export interface TaskChanges {
  /** Tasks that are new, or not what they were. */
  readonly saved: readonly Task[]
  /** Tasks gone from the list for good — purged, not merely trashed. */
  readonly removed: readonly TaskId[]
}

/**
 * Where an account's tasks live. Every call site talks to this interface rather
 * than to the service behind it, so that service is one file here rather than
 * something the rest of the app knows about.
 *
 * Changes are written task by task, never as the whole list: a device only ever
 * writes the tasks it changed, so it cannot undo what another device did to the
 * rest in the meantime.
 */
export interface TaskRepository {
  /**
   * Calls back with every saved task once they are known, and again whenever
   * they change — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onTasks: (tasks: Task[]) => void, onError: (error: unknown) => void): () => void
  save(changes: TaskChanges): Promise<void>
  /** Adds tasks that were kept somewhere else, leaving alone any the account already has. */
  importTasks(tasks: readonly Task[]): Promise<void>
}

/**
 * The tasks that differ between two versions of the list. The rules in ../core
 * hand back the very same object for a task they did not change, so identity is
 * what tells a changed task from an untouched one.
 */
export function changesBetween(before: readonly Task[], after: readonly Task[]): TaskChanges {
  const previous = new Map(before.map((task) => [task.id, task]))
  const kept = new Set(after.map((task) => task.id))

  return {
    saved: after.filter((task) => previous.get(task.id) !== task),
    removed: before.filter((task) => !kept.has(task.id)).map((task) => task.id),
  }
}
