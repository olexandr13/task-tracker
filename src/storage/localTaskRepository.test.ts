// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTask, type Task } from '../core'
import { clearGuestTasks, createLocalTaskRepository, loadGuestTasks } from './localTaskRepository'
import { SCHEMA_VERSION, toStoredTask } from './taskSchema'
import { expectConsole } from '../test/consoleGuard'

/* Guest tasks on this device. STORE ids refer to wiki/storage.md. */

afterEach(() => {
  clearGuestTasks()
  localStorage.clear()
})

const NOW = new Date('2026-01-01T12:00:00.000Z')

describe('createLocalTaskRepository', () => {
  it('keeps tasks across a fresh repository (STORE-37)', async () => {
    const first = createLocalTaskRepository()
    const one = { ...createTask('One', null, NOW), id: 'a' }
    await first.save({ saved: [one], removed: [] })

    const second = createLocalTaskRepository()
    const seen: Task[][] = []
    second.subscribe((tasks) => {
      seen.push(tasks)
    }, () => {})

    expect(seen.at(-1)?.map((t) => t.id)).toEqual(['a'])
    expect(loadGuestTasks()).toHaveLength(1)
  })

  it('takes older browser tasks into the guest store once (STORE-19, STORE-37)', () => {
    const legacy = { ...createTask('Old', null, NOW), id: 'legacy' }
    localStorage.setItem(
      'task-tracker/tasks',
      JSON.stringify({ version: SCHEMA_VERSION, tasks: [legacy] }),
    )

    const repository = createLocalTaskRepository()
    const seen: Task[][] = []
    repository.subscribe((tasks) => {
      seen.push(tasks)
    }, () => {})

    expect(seen.at(-1)?.map((t) => t.id)).toEqual(['legacy'])
    expect(localStorage.getItem('task-tracker/tasks')).toBeNull()
  })

  it('keeps older browser tasks where they are when the guest store cannot be written (STORE-20)', () => {
    expectConsole('Could not save to task-tracker/guest/tasks', 'Ignoring saved data at task-tracker/guest/tasks')
    const legacy = { ...createTask('Old', null, NOW), id: 'legacy' }
    const kept = JSON.stringify({ version: SCHEMA_VERSION, tasks: [legacy] })
    localStorage.setItem('task-tracker/tasks', kept)
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    loadGuestTasks()
    setItem.mockRestore()

    expect(localStorage.getItem('task-tracker/tasks')).toBe(kept)
  })

  it('does not import a task the guest already has (STORE-37)', async () => {
    const repository = createLocalTaskRepository()
    const one = { ...createTask('One', null, NOW), id: 'a' }
    await repository.save({ saved: [one], removed: [] })
    await repository.importTasks([
      { ...createTask('Changed', null, NOW), id: 'a' },
      { ...createTask('Two', null, NOW), id: 'b' },
    ])

    expect(loadGuestTasks().map((t) => t.title).sort()).toEqual(['One', 'Two'])
  })

  it('notifies subscribers when another tab writes (STORE-37)', async () => {
    const repository = createLocalTaskRepository()
    const seen: Task[][] = []
    repository.subscribe((tasks) => {
      seen.push(tasks)
    }, () => {})

    const fromTab = { ...createTask('From tab', null, NOW), id: 'a' }
    localStorage.setItem(
      'task-tracker/guest/tasks',
      JSON.stringify({ records: { a: toStoredTask(fromTab) } }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'task-tracker/guest/tasks', storageArea: localStorage }),
    )

    await vi.waitFor(() => {
      expect(seen.at(-1)?.[0]?.title).toBe('From tab')
    })
  })
})
