import type { Task } from '../core'
import type { TaskRepository } from './taskRepository'

const STORAGE_KEY = 'task-tracker/tasks'

/**
 * Bump this whenever the saved shape changes, and migrate on load. Storing the
 * version means old saved data can be upgraded rather than silently breaking.
 */
const SCHEMA_VERSION = 1

interface StoredTasks {
  version: number
  tasks: Task[]
}

export const localStorageTaskRepository: TaskRepository = {
  load(): Promise<Task[]> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return Promise.resolve([])
    }

    try {
      const stored = JSON.parse(raw) as StoredTasks
      if (stored.version !== SCHEMA_VERSION || !Array.isArray(stored.tasks)) {
        console.warn(`Ignoring saved tasks: unexpected shape (version ${String(stored.version)}).`)
        return Promise.resolve([])
      }
      return Promise.resolve(stored.tasks)
    } catch {
      console.warn('Ignoring saved tasks: the stored value could not be parsed.')
      return Promise.resolve([])
    }
  },

  save(tasks: Task[]): Promise<void> {
    const stored: StoredTasks = { version: SCHEMA_VERSION, tasks }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    return Promise.resolve()
  },
}
