import type { Task } from '../core'
import { migrateTasks } from './taskSchema'
import type { TaskRepository } from './taskRepository'

/** Where tasks were kept before they belonged to the account. */
const STORAGE_KEY = 'task-tracker/tasks'

interface StoredTasks {
  version: number
  tasks: unknown[]
}

/**
 * The tasks this browser still holds, in today's shape, or null when there is
 * nothing to move: none were ever kept here, or what is kept can't be trusted —
 * which is left where it is rather than thrown away.
 */
function readLocalTasks(): Task[] | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    return null
  }

  try {
    const stored = JSON.parse(raw) as StoredTasks
    const tasks = migrateTasks(stored.version, stored.tasks)
    if (tasks === null) {
      console.warn(`Ignoring saved tasks: unexpected shape (version ${String(stored.version)}).`)
    }
    return tasks
  } catch {
    console.warn('Ignoring saved tasks: the stored value could not be parsed.')
    return null
  }
}

/**
 * Moves the tasks this browser kept, from before tasks belonged to the account,
 * into the account, then forgets them here. Only once the account has them: a
 * move that fails, offline say, leaves them in the browser for the next attempt.
 */
export async function importLocalTasks(repository: TaskRepository): Promise<void> {
  const tasks = readLocalTasks()
  if (tasks === null) {
    return
  }

  if (tasks.length > 0) {
    // Asking the account what it already has needs the server (STORE-19). Offline
    // that wait is a hang; leave them here for the next open with a connection.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    await repository.importTasks(tasks)
  }
  localStorage.removeItem(STORAGE_KEY)
}
