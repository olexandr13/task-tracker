// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalDay } from '../../core'
import { AddTaskForm } from './AddTaskForm'

/* The add box, and the day a new task starts with. DUE and LIST ids refer to the wiki. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

function setup(defaultDueDate: LocalDay | null) {
  const user = userEvent.setup()
  const onAdd = vi.fn()
  render(<AddTaskForm now={WED_16} defaultDueDate={defaultDueDate} onAdd={onAdd} />)
  return { user, onAdd }
}

const box = () => screen.getByRole('textbox', { name: 'Add task' })
const dueButton = () => screen.queryByRole('button', { name: /^Due date:/ })

describe('AddTaskForm', () => {
  it('adds a task with no day in the full list (DUE-3)', async () => {
    const { user, onAdd } = setup(null)

    await user.type(box(), 'file taxes{Enter}')

    expect(onAdd).toHaveBeenCalledWith('file taxes', null, null)
  })

  it('starts a task on the list’s own day, so one added in Today is due today (LIST-6)', async () => {
    const { user, onAdd } = setup('2026-09-16')

    expect(dueButton()).toHaveProperty('ariaLabel', 'Due date: Today')
    await user.type(box(), 'file taxes{Enter}')

    expect(onAdd).toHaveBeenCalledWith('file taxes', null, '2026-09-16')
  })

  it('adds with the day chosen, then goes back to the list’s own day for the next task (DUE-4)', async () => {
    const { user, onAdd } = setup('2026-09-16')

    await user.click(dueButton()!)
    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))
    await user.type(box(), 'file taxes{Enter}')

    expect(onAdd).toHaveBeenLastCalledWith('file taxes', null, '2026-09-17')
    expect(dueButton()).toHaveProperty('ariaLabel', 'Due date: Today')
  })

  it('gives way to a repeat rule, which says which days the task is due (DUE-6)', async () => {
    const { user, onAdd } = setup('2026-09-16')

    await user.click(screen.getByRole('button', { name: /^Repeat:/ }))
    await user.click(screen.getByRole('button', { name: 'Daily' }))

    expect(dueButton()).toBeNull()
    await user.type(box(), 'stretch{Enter}')
    expect(onAdd).toHaveBeenCalledWith('stretch', { kind: 'daily' }, null)
  })
})
