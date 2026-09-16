import { ORDER_STEP, type Task } from '../core'
import type { TaskRepository } from './taskRepository'

const STORAGE_KEY = 'task-tracker/tasks'

/**
 * Bump this whenever the saved shape changes, and migrate on load. Storing the
 * version means old saved data can be upgraded rather than silently breaking.
 */
const SCHEMA_VERSION = 7

interface StoredTasks {
  version: number
  tasks: unknown[]
}

/** Version 6 had no due dates: a one-off belonged to no day in particular. */
type TaskV6 = Omit<Task, 'dueDate'>

/** Version 5 had no order of its own: a task's place was its place in the saved array. */
type TaskV5 = Omit<TaskV6, 'order'>

/** Version 4 had no checklists: a task was one thing, done or not. */
type TaskV4 = Omit<TaskV5, 'subtasks'>

/** Version 3 held only a title: there was nothing else to write about a task. */
type TaskV3 = Omit<TaskV4, 'description'>

/** Version 2 knew nothing about the trash: deleting a task dropped it outright. */
type TaskV2 = Omit<TaskV3, 'deletedAt'>

/** Version 1 knew nothing about repeating either: every task happened once. */
type TaskV1 = Omit<TaskV2, 'repeat'>

function fromV6(task: TaskV6): Task {
  return { ...task, dueDate: null }
}

/** The saved array was already in list order, so each task keeps the place it had. */
function fromV5(task: TaskV5, index: number): Task {
  return fromV6({ ...task, order: index * ORDER_STEP })
}

/**
 * Upgrades chain, so each step only has to know about the one shape it adds.
 * The index rides along for the one step that needs it.
 */
function fromV4(task: TaskV4, index: number): Task {
  return fromV5({ ...task, subtasks: [] }, index)
}

function fromV3(task: TaskV3, index: number): Task {
  return fromV4({ ...task, description: '' }, index)
}

function fromV2(task: TaskV2, index: number): Task {
  return fromV3({ ...task, deletedAt: null }, index)
}

function fromV1(task: TaskV1, index: number): Task {
  return fromV2({ ...task, repeat: null }, index)
}

/** Returns the saved tasks in today's shape, or null if the data can't be trusted. */
function migrate(stored: StoredTasks): Task[] | null {
  if (!Array.isArray(stored.tasks)) {
    return null
  }

  switch (stored.version) {
    case 1:
      return (stored.tasks as TaskV1[]).map(fromV1)
    case 2:
      return (stored.tasks as TaskV2[]).map(fromV2)
    case 3:
      return (stored.tasks as TaskV3[]).map(fromV3)
    case 4:
      return (stored.tasks as TaskV4[]).map(fromV4)
    case 5:
      return (stored.tasks as TaskV5[]).map(fromV5)
    case 6:
      return (stored.tasks as TaskV6[]).map(fromV6)
    case SCHEMA_VERSION:
      return stored.tasks as Task[]
    default:
      return null
  }
}

export const localStorageTaskRepository: TaskRepository = {
  load(): Promise<Task[]> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return Promise.resolve([])
    }

    try {
      const stored = JSON.parse(raw) as StoredTasks
      const tasks = migrate(stored)
      if (tasks === null) {
        console.warn(`Ignoring saved tasks: unexpected shape (version ${String(stored.version)}).`)
        return Promise.resolve([])
      }
      return Promise.resolve(tasks)
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
