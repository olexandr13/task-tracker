import { describe, expect, it } from 'vitest'
import { EmptyTitleError, completeTask, createTask, isComplete } from './task'

const NOW = new Date('2026-09-15T10:00:00.000Z')
const LATER = new Date('2026-09-15T18:30:00.000Z')

describe('createTask', () => {
  it('trims surrounding whitespace from the title', () => {
    expect(createTask('   buy milk  ').title).toBe('buy milk')
  })

  it('starts out todo, with no completion time', () => {
    const task = createTask('buy milk', NOW)

    expect(task.status).toBe('todo')
    expect(task.completedAt).toBeNull()
    expect(task.createdAt).toBe(NOW.toISOString())
  })

  it('rejects a title that is blank or only whitespace', () => {
    expect(() => createTask('   ')).toThrow(EmptyTitleError)
  })

  it('gives every task its own id', () => {
    expect(createTask('a').id).not.toBe(createTask('a').id)
  })
})

describe('completeTask', () => {
  it('marks the task done and stamps the time', () => {
    const done = completeTask(createTask('buy milk', NOW), LATER)

    expect(done.status).toBe('done')
    expect(done.completedAt).toBe(LATER.toISOString())
    expect(isComplete(done)).toBe(true)
  })

  it('leaves the original task untouched', () => {
    const task = createTask('buy milk', NOW)
    completeTask(task, LATER)

    expect(task.status).toBe('todo')
    expect(task.completedAt).toBeNull()
  })

  it('keeps the first completion time when completed twice', () => {
    const done = completeTask(createTask('buy milk', NOW), LATER)

    expect(completeTask(done, new Date('2026-09-16T09:00:00.000Z'))).toBe(done)
  })
})
