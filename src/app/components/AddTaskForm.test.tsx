// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalDay } from '../../core'
import { AddTaskForm } from './AddTaskForm'
import { AddTaskSheet } from './AddTaskSheet'

/* The add box, the Plus, and the detailed sheet. DUE, LIST, TASK and UI ids refer to the wiki. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

function setupForm(defaultDueDate: LocalDay | null) {
  const user = userEvent.setup()
  const onAdd = vi.fn()
  const onOpenSheet = vi.fn()
  render(
    <AddTaskForm
      now={WED_16}
      defaultDueDate={defaultDueDate}
      onAdd={onAdd}
      onOpenSheet={onOpenSheet}
    />,
  )
  return { user, onAdd, onOpenSheet }
}

const box = () => screen.getByRole('textbox', { name: 'Add task' })
const scheduleButton = () => screen.getByRole('button', { name: /^Schedule:/ })
const plus = () => screen.getByRole('button', { name: 'Add task' })

describe('AddTaskForm', () => {
  it('adds a task with no day in the full list (DUE-3)', async () => {
    const { user, onAdd } = setupForm(null)

    await user.type(box(), 'file taxes{Enter}')

    expect(onAdd).toHaveBeenCalledWith('file taxes', null, null)
  })

  it('starts a task on the list’s own day, so one added in Today is due today (LIST-6)', async () => {
    const { user, onAdd } = setupForm('2026-09-16')

    expect(scheduleButton()).toHaveProperty('ariaLabel', 'Schedule: Today')
    await user.type(box(), 'file taxes{Enter}')

    expect(onAdd).toHaveBeenCalledWith('file taxes', null, '2026-09-16')
    expect(scheduleButton()).toHaveProperty('ariaLabel', 'Schedule: Today')
  })

  it('adds with the day chosen, then goes back to the list’s own day for the next task (DUE-4)', async () => {
    const { user, onAdd } = setupForm('2026-09-16')

    await user.click(scheduleButton())
    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))
    await user.type(box(), 'file taxes{Enter}')

    expect(onAdd).toHaveBeenLastCalledWith('file taxes', null, '2026-09-17')
    expect(scheduleButton()).toHaveProperty('ariaLabel', 'Schedule: Today')
  })

  it('gives way to a repeat rule, which says which days the task is due (DUE-6)', async () => {
    const { user, onAdd } = setupForm('2026-09-16')

    await user.click(scheduleButton())
    await user.click(screen.getByRole('button', { name: 'Daily' }))

    expect(scheduleButton()).toHaveProperty('ariaLabel', 'Schedule: Daily')
    expect(scheduleButton().textContent).toBe('Daily')
    await user.type(box(), 'stretch{Enter}')
    expect(onAdd).toHaveBeenCalledWith('stretch', { kind: 'daily' }, null)
  })

  it('starts a habit on a daily rule, and goes back to daily after adding (HAB-24)', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(
      <AddTaskForm
        now={WED_16}
        defaultDueDate={null}
        defaultRepeat={{ kind: 'daily' }}
        label="Add habit"
        onAdd={onAdd}
        onOpenSheet={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Add habit' })).toBeTruthy()
    expect(scheduleButton()).toHaveProperty('ariaLabel', 'Schedule: Daily')
    await user.type(screen.getByRole('textbox', { name: 'Add habit' }), 'stretch{Enter}')
    expect(onAdd).toHaveBeenCalledWith('stretch', { kind: 'daily' }, null)
    expect(scheduleButton()).toHaveProperty('ariaLabel', 'Schedule: Daily')
  })

  it('opens the detailed sheet from the Plus (UI-54)', async () => {
    const { user, onOpenSheet } = setupForm(null)

    await user.click(plus())

    expect(onOpenSheet).toHaveBeenCalledOnce()
  })
})

describe('AddTaskSheet', () => {
  function setupSheet(label = 'Add task') {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(
      <AddTaskSheet
        now={WED_16}
        label={label}
        defaultDueDate="2026-09-16"
        knownTags={['home']}
        lists={[]}
        onAdd={onAdd}
        onClose={onClose}
      />,
    )
    return { user, onAdd, onClose }
  }

  it('adds a task with the fields set in the sheet (TASK-66)', async () => {
    const { user, onAdd } = setupSheet()
    const sheet = screen.getByRole('dialog', { name: 'Add task' })
    const open = within(sheet)

    await user.type(open.getByRole('textbox', { name: 'Add task' }), 'file taxes')
    await user.click(open.getByRole('button', { name: /^Urgent for/ }))
    await user.click(open.getByRole('button', { name: 'Add task' }))

    expect(onAdd).toHaveBeenCalledWith(
      'file taxes',
      null,
      '2026-09-16',
      [],
      null,
      expect.objectContaining({ urgent: true, description: '', reward: null, timeGoal: null }),
    )
  })

  it('does not add without a title (TASK-2, TASK-66)', async () => {
    const { user, onAdd } = setupSheet()
    const sheet = within(screen.getByRole('dialog', { name: 'Add task' }))

    expect(sheet.getByRole('button', { name: 'Add task' })).toHaveProperty('disabled', true)
    await user.click(sheet.getByRole('button', { name: 'Add task' }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('closes on Escape without adding (UI-9, UI-10)', async () => {
    const { user, onAdd, onClose } = setupSheet()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('starts a habit sheet on a daily rule (HAB-24)', () => {
    render(
      <AddTaskSheet
        now={WED_16}
        label="Add habit"
        defaultDueDate={null}
        defaultRepeat={{ kind: 'daily' }}
        knownTags={[]}
        lists={[]}
        onAdd={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Add habit' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Schedule for/ })).toHaveProperty(
      'ariaLabel',
      'Schedule for "Add habit": Daily',
    )
  })
})
