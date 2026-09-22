import type { Task } from '../core'
import { createLocalCollection } from './localCollection'
import { forgetLegacyTasks, readLegacyTasks } from './localTaskImport'
import { readStoredTask, toStoredTask } from './taskSchema'
import type { TaskRepository } from './taskRepository'

/** Where the guest's tasks live. One set per browser address. */
const STORAGE_KEY = 'task-tracker/guest/tasks'

/**
 * Tasks this browser still holds from before accounts (STORE-19) start the
 * guest's tasks, and are forgotten only once the guest's are saved.
 */
const collection = createLocalCollection<Task>({
  key: STORAGE_KEY,
  read: readStoredTask,
  write: toStoredTask,
  idOf: (task) => task.id,
  seed: () => readLegacyTasks() ?? [],
  onSeeded: forgetLegacyTasks,
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
