// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { completeTask, createTask, setDueDate, toLocalDay, type Task } from '../core'
import { importLocalTasks } from './localTaskImport'
import type { TaskRepository } from './taskRepository'

const KEY = 'task-tracker/tasks'
const NOW = new Date('2026-09-15T10:00:00.000Z')

/** A repository that only records what was imported into it, or refuses to take anything. */
function repositoryThat(outcome: 'accepts' | 'fails') {
  const imported: Task[] = []
  const repository: TaskRepository = {
    subscribe: () => () => {},
    save: () => Promise.resolve(),
    importTasks(tasks) {
      if (outcome === 'fails') return Promise.reject(new Error('offline'))
      imported.push(...tasks)
      return Promise.resolve()
    },
  }
  return { repository, imported }
}

afterEach(() => { localStorage.clear() })

describe('importLocalTasks', () => {
  it('moves the tasks kept in the browser into the account, then forgets them here', async () => {
    const task = setDueDate(createTask('file taxes', null, NOW), '2026-09-20')
    localStorage.setItem(KEY, JSON.stringify({ version: 8, tasks: [task] }))
    const { repository, imported } = repositoryThat('accepts')

    await importLocalTasks(repository)

    expect(imported).toEqual([task])
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('keeps them in the browser when the account could not take them', async () => {
    const saved = JSON.stringify({ version: 8, tasks: [createTask('file taxes', null, NOW)] })
    localStorage.setItem(KEY, saved)

    await expect(importLocalTasks(repositoryThat('fails').repository)).rejects.toThrow('offline')

    expect(localStorage.getItem(KEY)).toBe(saved)
  })

  it('leaves data it cannot read where it is', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 99, tasks: [] }))
    const { repository, imported } = repositoryThat('accepts')

    await importLocalTasks(repository)

    expect(imported).toEqual([])
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it('starts the history of a repeating task saved before history was kept at its last completion', async () => {
    const { doneDays, ...daily } = completeTask(createTask('stretch', { kind: 'daily' }, NOW), NOW)
    const { doneDays: none, ...oneOff } = completeTask(createTask('file taxes', null, NOW), NOW)
    expect([doneDays, none]).toEqual([[toLocalDay(NOW)], []])
    localStorage.setItem(KEY, JSON.stringify({ version: 7, tasks: [daily, oneOff] }))
    const { repository, imported } = repositoryThat('accepts')

    await importLocalTasks(repository)

    expect(imported.map((task) => task.doneDays)).toEqual([[toLocalDay(NOW)], []])
  })

  it('gives tasks saved before due dates existed no day of their own', async () => {
    const { dueDate, doneDays, ...savedAtV6 } = createTask('file taxes', null, NOW)
    expect([dueDate, doneDays]).toEqual([null, []])
    localStorage.setItem(KEY, JSON.stringify({ version: 6, tasks: [savedAtV6] }))
    const { repository, imported } = repositoryThat('accepts')

    await importLocalTasks(repository)

    expect(imported).toEqual([{ ...savedAtV6, dueDate: null, doneDays: [] }])
  })

  it('carries the oldest saved shape all the way up', async () => {
    const { id, title, status, createdAt, completedAt } = createTask('file taxes', null, NOW)
    const v1 = { id, title, status, createdAt, completedAt }
    localStorage.setItem(KEY, JSON.stringify({ version: 1, tasks: [v1, v1] }))
    const { repository, imported } = repositoryThat('accepts')

    await importLocalTasks(repository)

    expect(imported.map((task) => task.dueDate)).toEqual([null, null])
    expect(imported[1]).toMatchObject({ repeat: null, description: '', subtasks: [], deletedAt: null })
  })
})
