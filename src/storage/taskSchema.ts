import { ORDER_STEP, toLocalDay, type Task } from '../core'

/**
 * The saved shape of a task, wherever it is saved. Bump this whenever that shape
 * changes, and add a step below: storing the version means old saved data can be
 * upgraded rather than silently breaking.
 */
export const SCHEMA_VERSION = 8

/** Version 7 kept no history: a repeating task knew only the last time it was done. */
type TaskV7 = Omit<Task, 'doneDays'>

/** Version 6 had no due dates: a one-off belonged to no day in particular. */
type TaskV6 = Omit<TaskV7, 'dueDate'>

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

/**
 * The last completion is the one day of a repeating task's history anything
 * remembers, so its history starts there. A one-off has none to start.
 */
function fromV7(task: TaskV7): Task {
  const last = task.repeat === null ? null : task.completedAt
  return { ...task, doneDays: last === null ? [] : [toLocalDay(new Date(last))] }
}

function fromV6(task: TaskV6): Task {
  return fromV7({ ...task, dueDate: null })
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

/**
 * Returns tasks saved at `version` in today's shape, or null if the data can't be
 * trusted. They are passed in list order: shapes older than version 6 took a
 * task's place from where it sat.
 */
export function migrateTasks(version: unknown, tasks: unknown): Task[] | null {
  if (!Array.isArray(tasks)) {
    return null
  }

  switch (version) {
    case 1:
      return (tasks as TaskV1[]).map(fromV1)
    case 2:
      return (tasks as TaskV2[]).map(fromV2)
    case 3:
      return (tasks as TaskV3[]).map(fromV3)
    case 4:
      return (tasks as TaskV4[]).map(fromV4)
    case 5:
      return (tasks as TaskV5[]).map(fromV5)
    case 6:
      return (tasks as TaskV6[]).map(fromV6)
    case 7:
      return (tasks as TaskV7[]).map(fromV7)
    case SCHEMA_VERSION:
      return tasks as Task[]
    default:
      return null
  }
}
