import type { Task } from '../core'
import { createLocalCollection } from './localCollection'
import { migrateTasks, readStoredTask, toStoredTask } from './taskSchema'
import type { TaskRepository } from './taskRepository'

/** Where the guest's tasks live. One set per browser address. */
const STORAGE_KEY = 'task-tracker/guest/tasks'

/** Where tasks were kept before they belonged to any account (STORE-19). */
const LEGACY_KEY = 'task-tracker/tasks'

/**
 * Tasks this browser still holds from before accounts, in today's shape — or
 * empty when there is nothing to take. Taken once into the guest store.
 */
function legacyTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw === null) return []
    const stored = JSON.parse(raw) as { version?: unknown; tasks?: unknown }
    const tasks = migrateTasks(stored.version, stored.tasks)
    if (tasks === null) {
      console.warn(`Ignoring saved tasks: unexpected shape (version ${String(stored.version)}).`)
      return []
    }
    localStorage.removeItem(LEGACY_KEY)
    return tasks
  } catch {
    console.warn('Ignoring saved tasks: the stored value could not be parsed.')
    return []
  }
}

const collection = createLocalCollection<Task>({
  key: STORAGE_KEY,
  read: readStoredTask,
  write: toStoredTask,
  idOf: (task) => task.id,
  seed: legacyTasks,
})

/**
 * The guest's tasks in this browser. Same shape as the account's, same schema,
 * never leaves the device.
 */
export function createLocalTaskRepository(): TaskRepository {
  return {
    subscribe(onTasks, onError) {
      return collection.subscribe(onTasks, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },

    async importTasks(incoming) {
      const known = new Set(collection.load().map((task) => task.id))
      collection.apply(
        incoming.filter((task) => !known.has(task.id)),
        [],
      )
    },
  }
}

/** Every guest task, for moving into a signed-in account. */
export function loadGuestTasks(): Task[] {
  return collection.load()
}

export function clearGuestTasks(): void {
  collection.clear()
}
