// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createTask, setDueDate } from '../core'
import { localStorageTaskRepository } from './localStorageTaskRepository'

const KEY = 'task-tracker/tasks'
const NOW = new Date('2026-09-15T10:00:00.000Z')

afterEach(() => { localStorage.clear() })

describe('localStorageTaskRepository', () => {
  it('reads back what it saved, due date included', async () => {
    const task = setDueDate(createTask('file taxes', null, NOW), '2026-09-20')

    await localStorageTaskRepository.save([task])

    expect(await localStorageTaskRepository.load()).toEqual([task])
  })

  it('gives tasks saved before due dates existed no day of their own', async () => {
    const { dueDate, ...savedAtV6 } = createTask('file taxes', null, NOW)
    expect(dueDate).toBeNull()
    localStorage.setItem(KEY, JSON.stringify({ version: 6, tasks: [savedAtV6] }))

    const [loaded] = await localStorageTaskRepository.load()

    expect(loaded).toEqual({ ...savedAtV6, dueDate: null })
  })

  it('carries the oldest saved shape all the way up', async () => {
    const { id, title, status, createdAt, completedAt } = createTask('file taxes', null, NOW)
    const v1 = { id, title, status, createdAt, completedAt }
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [v1, v1] }))

    const loaded = await localStorageTaskRepository.load()

    expect(loaded.map((task) => task.dueDate)).toEqual([null, null])
    expect(loaded[1]).toMatchObject({ repeat: null, description: '', subtasks: [], deletedAt: null })
  })
})
