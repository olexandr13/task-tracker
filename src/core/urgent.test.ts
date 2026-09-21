import { describe, expect, it } from 'vitest'
import { createTask } from './task'
import { isUrgent, setUrgent } from './urgent'

const NOW = new Date(2026, 8, 16, 12, 0)

describe('urgent', () => {
  it('starts off (TASK-61)', () => {
    const task = createTask('buy milk', null, NOW)

    expect(task.urgent).toBe(false)
    expect(isUrgent(task)).toBe(false)
  })

  it('marks and clears a task (TASK-60)', () => {
    const task = createTask('buy milk', null, NOW)
    const marked = setUrgent(task, true)

    expect(marked.urgent).toBe(true)
    expect(isUrgent(marked)).toBe(true)
    expect(setUrgent(marked, false).urgent).toBe(false)
    expect(task.urgent).toBe(false)
  })

  it('leaves the task as it is when the mark has not changed', () => {
    const task = setUrgent(createTask('buy milk', null, NOW), true)

    expect(setUrgent(task, true)).toBe(task)
  })
})
