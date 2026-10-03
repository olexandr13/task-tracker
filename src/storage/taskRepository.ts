import type { ListId, LocalDay, Task, TaskId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the list comes to, task by task (./recordChanges). */
export type TaskChanges = RecordChanges<Task, TaskId>

/**
 * Some of an account's tasks, as the server can count them without loading
 * them: all of them, the ones filed under one list — the Inbox is the ones
 * filed under none — or the ones carrying one tag, spelled as it is kept.
 */
export type TaskScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'list'; readonly listId: ListId | null }
  | { readonly kind: 'tag'; readonly tag: string }

/** Whether a task is in the scope, asked exactly as the server asks it. */
export function inScope(task: Task, scope: TaskScope): boolean {
  switch (scope.kind) {
    case 'all':
      return true
    case 'list':
      return task.listId === scope.listId
    case 'tag':
      return task.tags.includes(scope.tag)
  }
}

/** The tasks a device is holding, and the way to hold more of them. */
export interface TaskSubscription {
  /**
   * Holds history as well (STORE-55): every task finished on or after `day`, or
   * every task there is with null. Asking for what is held, or asked for,
   * already does nothing. The subscription calls back once it has arrived.
   */
  reachBack(day: LocalDay | null): void
  /**
   * How many tasks in `scope` are not held — history not reached back to —
   * as the server counts them now, or null when it cannot be asked: with no
   * connection, or before the tasks have loaded.
   */
  unheld(scope: TaskScope): Promise<number | null>
  stop(): void
}

/**
 * Where an account's tasks live. Every call site talks to this interface rather
 * than to the service behind it, so that service is one file here rather than
 * something the rest of the app knows about.
 *
 * Changes are written task by task, never as the whole list: a device only ever
 * writes the tasks it changed, so it cannot undo what another device did to the
 * rest in the meantime — and it never has to hold every task to change one.
 */
export interface TaskRepository {
  /**
   * Holds every task but the history as of `start` (`isHistory`), and calls back
   * with what it holds once that is known, and again whenever it changes — here,
   * in another tab or on another device. With the tasks comes the day from which
   * every finished task is held: `start` at first, earlier as `reachBack` brings
   * history in, and null once every task is.
   */
  subscribe(
    start: LocalDay,
    onTasks: (tasks: Task[], heldSince: LocalDay | null) => void,
    onError: (error: unknown) => void,
  ): TaskSubscription
  save(changes: TaskChanges): Promise<void>
  /** Adds tasks that were kept somewhere else, leaving alone any the account already has. */
  importTasks(tasks: readonly Task[]): Promise<void>
}
