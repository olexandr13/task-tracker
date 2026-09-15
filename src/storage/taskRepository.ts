import type { Task } from '../core'

/**
 * Where tasks live. Step 1 has exactly one implementation (localStorage), but
 * every call site talks to this interface instead, so swapping in IndexedDB or a
 * sync server later is a new file here rather than a change everywhere else.
 *
 * Async on purpose, even though localStorage is synchronous.
 */
export interface TaskRepository {
  load(): Promise<Task[]>
  save(tasks: Task[]): Promise<void>
}
