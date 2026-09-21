import { ORDER_STEP, toLocalDay, type Task } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a task, wherever it is saved. Bump this whenever that shape
 * changes, and add a step below: storing the version means old saved data can be
 * upgraded rather than silently breaking.
 */
export const SCHEMA_VERSION = 15

/**
 * Version 14 ranked urgency as low, medium or high (or none). Today's shape is a
 * single urgent mark: high becomes urgent, everything else does not.
 */
type TaskV14 = Omit<Task, 'urgent'> & { readonly priority: 'low' | 'medium' | 'high' | null }

/** Version 13 had no priority and no urgent mark: a task was no more urgent than any other. */
type TaskV13 = Omit<TaskV14, 'priority'>

/** Version 12 had no skipping: an occurrence was done or missed, nothing between. */
type TaskV12 = Omit<TaskV13, 'skippedDays'>

/** Version 11 had no time goals: a task was done or not, however long it took. */
type TaskV11 = Omit<TaskV12, 'timeGoal' | 'timeLog'>

/** Version 10 had no lists: a task was filed nowhere, so every task was in the Inbox. */
type TaskV10 = Omit<TaskV11, 'listId'>

/** Version 9 had no rewards: finishing a task earned nothing. */
type TaskV9 = Omit<TaskV10, 'reward'>

/** Version 8 had no tags: a task belonged with no others. */
type TaskV8 = Omit<TaskV9, 'tags'>

/** Version 7 kept no history: a repeating task knew only the last time it was done. */
type TaskV7 = Omit<TaskV8, 'doneDays'>

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

function fromV14(task: TaskV14): Task {
  const { priority, ...rest } = task
  return { ...rest, urgent: priority === 'high' }
}

function fromV13(task: TaskV13): Task {
  return fromV14({ ...task, priority: null })
}

function fromV12(task: TaskV12): Task {
  return fromV13({ ...task, skippedDays: [] })
}

function fromV11(task: TaskV11): Task {
  return fromV12({ ...task, timeGoal: null, timeLog: [] })
}

function fromV10(task: TaskV10): Task {
  return fromV11({ ...task, listId: null })
}

function fromV9(task: TaskV9): Task {
  return fromV10({ ...task, reward: null })
}

function fromV8(task: TaskV8): Task {
  return fromV9({ ...task, tags: [] })
}

/**
 * The last completion is the one day of a repeating task's history anything
 * remembers, so its history starts there. A one-off has none to start.
 */
function fromV7(task: TaskV7): Task {
  const last = task.repeat === null ? null : task.completedAt
  return fromV8({ ...task, doneDays: last === null ? [] : [toLocalDay(new Date(last))] })
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
    case 8:
      return (tasks as TaskV8[]).map(fromV8)
    case 9:
      return (tasks as TaskV9[]).map(fromV9)
    case 10:
      return (tasks as TaskV10[]).map(fromV10)
    case 11:
      return (tasks as TaskV11[]).map(fromV11)
    case 12:
      return (tasks as TaskV12[]).map(fromV12)
    case 13:
      return (tasks as TaskV13[]).map(fromV13)
    case 14:
      return (tasks as TaskV14[]).map(fromV14)
    case SCHEMA_VERSION:
      return tasks as Task[]
    default:
      return null
  }
}

/** One task, under the version of the shape it was saved in: a record in the account, or in a backup. */
export interface StoredTask {
  version: number
  task: Task
}

export function toStoredTask(task: Task): StoredTask {
  return { version: SCHEMA_VERSION, task }
}

/**
 * A saved task in today's shape, or null when it can't be trusted — an unknown
 * version, or no task with an id to file it under. Anything past the id is
 * trusted to be what its version says, as the app wrote it.
 */
export function readStoredTask(data: unknown): Task | null {
  if (!isRecord(data) || !isRecord(data.task) || typeof data.task.id !== 'string' || data.task.id === '') return null

  return migrateTasks(data.version, [data.task])?.[0] ?? null
}
