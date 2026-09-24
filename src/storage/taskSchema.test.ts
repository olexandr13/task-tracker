import { describe, expect, it } from 'vitest'
import { createTask, setDueDate } from '../core'
import { migrateTasks, readStoredTask, SCHEMA_VERSION, toStoredTask } from './taskSchema'

/* The saved shape of a task and the upgrades into it. STORE ids refer to wiki/storage.md. */

const NOW = new Date(2026, 8, 16, 9, 0)

/** A task as it stands today, with the fields a given version had stripped back off it. */
function saved(...without: string[]): Record<string, unknown> {
  const task: Record<string, unknown> = { ...setDueDate(createTask('file taxes', null, NOW), '2026-09-20') }
  for (const field of without) delete task[field]
  return task
}

describe('migrateTasks', () => {
  it('gives a task saved before there were hours no hour to be due at (STORE-1)', () => {
    const [task] = migrateTasks(17, [saved('dueTime')]) ?? []

    expect(task?.dueTime).toBeNull()
    expect(task?.dueDate).toBe('2026-09-20')
  })

  it('carries the hour through from an older shape still (STORE-1)', () => {
    // Every step chains into the next, so one saved before start days comes out
    // with both of the fields added since.
    const [task] = migrateTasks(16, [saved('dueTime', 'startDay')]) ?? []

    expect(task?.dueTime).toBeNull()
    expect(task?.startDay).toBeNull()
  })

  it('leaves a task already in today\'s shape as it is', () => {
    const task = { ...setDueDate(createTask('file taxes', null, NOW), '2026-09-20'), dueTime: '09:00' }

    expect(migrateTasks(SCHEMA_VERSION, [task])?.[0]).toEqual(task)
  })

  it('refuses a version it does not know', () => {
    expect(migrateTasks(SCHEMA_VERSION + 1, [saved()])).toBeNull()
    expect(migrateTasks(17, 'not an array')).toBeNull()
  })
})

describe('readStoredTask', () => {
  it('reads a task back under the version it was saved at', () => {
    const task = { ...setDueDate(createTask('file taxes', null, NOW), '2026-09-20'), dueTime: '09:00' }

    expect(readStoredTask(toStoredTask(task))).toEqual(task)
  })

  it('upgrades one saved before there were hours', () => {
    expect(readStoredTask({ version: 17, task: saved('dueTime') })?.dueTime).toBeNull()
  })

  it('refuses anything with no task or no id to file it under', () => {
    expect(readStoredTask({ version: SCHEMA_VERSION })).toBeNull()
    expect(readStoredTask({ version: SCHEMA_VERSION, task: { ...saved(), id: '' } })).toBeNull()
  })
})
