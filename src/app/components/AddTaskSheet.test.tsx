// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddTaskSheet } from './AddTaskSheet'

/* The detailed add sheet. RWD ids refer to wiki/rewards.md. */

afterEach(cleanup)

const NOW = new Date(2026, 9, 7, 10)

function setup(newTaskReward?: number | null) {
  const onAdd = vi.fn()
  render(
    <AddTaskSheet
      now={NOW}
      defaultDueDate={null}
      newTaskReward={newTaskReward}
      knownTags={[]}
      lists={[]}
      onClose={vi.fn()}
      onAdd={onAdd}
    />,
  )
  return { user: userEvent.setup(), onAdd }
}

/** What the sheet added the task as worth. */
function addedReward(onAdd: ReturnType<typeof vi.fn>): unknown {
  const details = onAdd.mock.lastCall?.[6] as { reward: unknown } | undefined
  return details?.reward
}

describe('the reward a new task starts with (RWD-45)', () => {
  it('starts the task at the reward set for new tasks, and says so', async () => {
    const { user, onAdd } = setup(3)

    expect(screen.getByRole('button', { name: 'Reward for "Add task": 3 points' })).toBeTruthy()
    await user.keyboard('Water the plants{Enter}')

    expect(addedReward(onAdd)).toBe(3)
  })

  it('starts the task at none while nothing is set', async () => {
    const { user, onAdd } = setup()

    await user.keyboard('Water the plants{Enter}')

    expect(addedReward(onAdd)).toBeNull()
  })

  it('adds it at none when the reward is taken away before adding', async () => {
    const { user, onAdd } = setup(3)

    await user.keyboard('Water the plants')
    await user.click(screen.getByRole('button', { name: 'Reward for "Water the plants": 3 points' }))
    await user.click(screen.getByRole('button', { name: 'Remove reward' }))
    await user.click(screen.getByRole('textbox', { name: 'Add task' }))
    await user.keyboard('{Enter}')

    expect(addedReward(onAdd)).toBeNull()
  })
})
