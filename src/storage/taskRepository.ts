import type { Task, TaskId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the list comes to, task by task (./recordChanges). */
export type TaskChanges = RecordChanges<Task, TaskId>

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
