// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendGoal, createGoal, type Goal, type GoalId } from '../../core'
import { GoalPicker } from './GoalPicker'

/* Linking a task to a goal from a woken row or a task's sheet. GOAL ids refer to wiki/goals.md. */

const AT = new Date(2026, 9, 15, 9, 0)

afterEach(cleanup)

const FIT = createGoal('Get fit', AT)
const APP = createGoal('Ship the app', AT)
const GOALS = appendGoal(appendGoal([], FIT), APP)

function setup(goalId: GoalId | null = null, goals: readonly Goal[] = GOALS) {
  const onChange = vi.fn()
  render(<GoalPicker goalId={goalId} goals={goals} onChange={onChange} />)
  return { user: userEvent.setup(), onChange }
}

const panel = () => screen.queryByRole('dialog', { name: 'Goal' })

describe('the goal button (GOAL-13, GOAL-14)', () => {
  it('names the goal the task serves, or none — a goal gone elsewhere included (GOAL-6)', () => {
    setup(FIT.id)
    expect(screen.getByRole('button', { name: 'Goal: Get fit' })).toBeTruthy()
    cleanup()

    setup('a-goal-deleted-elsewhere')
    expect(screen.getByRole('button', { name: 'Goal: No goal' })).toBeTruthy()
  })

  it('opens on No goal and every goal, the task\'s own marked', async () => {
    const { user } = setup(APP.id)

    await user.click(screen.getByRole('button', { name: 'Goal: Ship the app' }))

    expect(screen.getByRole('button', { pressed: true }).textContent).toContain('Ship the app')
    expect(screen.getAllByRole('button', { pressed: false }).map((button) => button.textContent)).toEqual(['No goal', 'Get fit'])
  })

  it('links the task and closes: a task serves one goal at a time (GOAL-2)', async () => {
    const { user, onChange } = setup(null)

    await user.click(screen.getByRole('button', { name: 'Goal: No goal' }))
    await user.click(screen.getByRole('button', { name: /Get fit/ }))

    expect(onChange).toHaveBeenCalledWith(FIT.id)
    expect(panel()).toBeNull()
  })

  it('takes the task off its goal with No goal', async () => {
    const { user, onChange } = setup(FIT.id)

    await user.click(screen.getByRole('button', { name: 'Goal: Get fit' }))
    await user.click(screen.getByRole('button', { name: /No goal/ }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('says where to make one while there are no goals (GOAL-1)', async () => {
    const { user } = setup(null, [])

    await user.click(screen.getByRole('button', { name: 'Goal: No goal' }))

    expect(screen.getByText('No goals yet. Make one on the Goals page.')).toBeTruthy()
  })
})
