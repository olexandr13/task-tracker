// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendGoal, createGoal, type GoalSummary } from '../../core'
import { WAYS_OUT } from '../../test/confirmSheet'
import { GoalsPage } from './GoalsPage'

/* The Goals page. GOAL ids refer to wiki/goals.md. */

const AT = new Date(2026, 9, 15, 9, 0)

afterEach(cleanup)

const GOALS = appendGoal(appendGoal(appendGoal([], createGoal('Get fit', AT)), createGoal('Ship the app', AT)), createGoal('Learn Spanish', AT))
const [FIT, APP, SPANISH] = GOALS

const SUMMARY: GoalSummary[] = [
  { goal: FIT, done: 3, total: 4 },
  { goal: APP, done: 2, total: 2 },
  { goal: SPANISH, done: 0, total: 0 },
]

function setup(goals: readonly GoalSummary[] = SUMMARY) {
  const handlers = {
    onOpen: vi.fn(),
    onAdd: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onDelete: vi.fn(),
  }
  render(<GoalsPage goals={goals} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('what the page lists', () => {
  it('lists every goal with how far it has got (GOAL-7, GOAL-8, GOAL-16)', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Get fit: 3 of 4 done, 75%' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ship the app: All 2 done, 100%' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Learn Spanish: no tasks yet' })).toBeTruthy()
    expect(screen.getByText('3 of 4 done · 75%')).toBeTruthy()
    expect(screen.getByText('No tasks yet · —')).toBeTruthy()
  })

  it('opens a goal\'s tasks (GOAL-10)', async () => {
    const { user, onOpen } = setup()

    await user.click(screen.getByRole('button', { name: /^Get fit/ }))

    expect(onOpen).toHaveBeenCalledExactlyOnceWith(FIT.id)
  })

  it('says how to start when there are no goals, and what the page is for behind its i (GOAL-16, UI-73)', async () => {
    const { user } = setup([])

    expect(screen.getByText('No goals yet. Name one above, then link the tasks that move it forward.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'About Goals' }))
    expect(screen.getByRole('dialog', { name: 'Goals' })).toBeTruthy()
  })
})

describe('making a goal', () => {
  it('makes one on Enter in the box, a phrase and all, and clears it for the next (GOAL-3, GOAL-18)', async () => {
    const { user, onAdd } = setup()

    await user.type(screen.getByRole('textbox', { name: 'Name of the new goal' }), 'Run a half marathon{Enter}')

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('Run a half marathon')
    expect((screen.getByRole('textbox', { name: 'Name of the new goal' }) as HTMLInputElement).value).toBe('')
  })

  it('says so rather than making a second goal of the same name, keeping what was typed (GOAL-4)', async () => {
    const { user, onAdd } = setup()
    onAdd.mockReturnValue(false)

    await user.type(screen.getByRole('textbox', { name: 'Name of the new goal' }), 'get fit{Enter}')

    expect(screen.getByRole('alert').textContent).toBe('There is a goal called that already.')
    expect((screen.getByRole('textbox', { name: 'Name of the new goal' }) as HTMLInputElement).value).toBe('get fit')
  })
})

describe('renaming a goal', () => {
  it('renames on Enter, and leaves it as it was on Escape (GOAL-5)', async () => {
    const { user, onRename } = setup()

    await user.click(screen.getByRole('button', { name: 'Rename the goal "Get fit"' }))
    await user.keyboard('{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Name of the goal "Get fit"' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Rename the goal "Get fit"' }))
    const box = screen.getByRole('textbox', { name: 'Name of the goal "Get fit"' })
    await user.clear(box)
    await user.type(box, 'Get strong{Enter}')

    expect(onRename).toHaveBeenCalledExactlyOnceWith(FIT.id, 'Get strong')
  })

  it('says so rather than renaming onto another goal\'s name, keeping the box open (GOAL-4)', async () => {
    const { user, onRename } = setup()
    onRename.mockReturnValue(false)

    await user.click(screen.getByRole('button', { name: 'Rename the goal "Get fit"' }))
    const box = screen.getByRole('textbox', { name: 'Name of the goal "Get fit"' })
    await user.clear(box)
    await user.type(box, 'Ship the app{Enter}')

    expect(screen.getByRole('alert').textContent).toBe('There is a goal called that already.')
    expect(screen.getByRole('textbox', { name: 'Name of the goal "Get fit"' })).toBeTruthy()
  })
})

describe('deleting a goal', () => {
  it('asks first, in a sheet, saying its tasks stay (GOAL-17)', async () => {
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the goal "Get fit"' }))

    const sheet = screen.getByRole('dialog', { name: 'Delete the goal "Get fit"?' })
    expect([...sheet.querySelectorAll('p')].map((line) => line.textContent)).toEqual([
      'Its tasks stop counting towards it.',
      'The tasks themselves are not deleted.',
    ])
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(FIT.id)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each(WAYS_OUT)('deletes nothing when %s closes the sheet (GOAL-17)', async (_, leave) => {
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the goal "Get fit"' }))
    await leave(user)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
  })
})
