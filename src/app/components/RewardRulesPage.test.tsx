// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BONUS_IDS, createPointValue, NO_BONUSES, type PeriodBonuses, type PointValue, type RewardEntry } from '../../core'
import { RewardRulesPage } from './RewardRulesPage'

/* The rewards rules page. RWD ids refer to wiki/rewards.md. */

afterEach(cleanup)

const NOW = new Date(2026, 9, 7, 12)

function setup(
  bonuses: PeriodBonuses = NO_BONUSES,
  pointValue: PointValue | null = null,
  cases?: ReactNode,
  newTaskReward: number | null = null,
  entries: readonly RewardEntry[] = [],
) {
  const onChangeBonus = vi.fn()
  const onChangePointValue = vi.fn()
  const onChangeNewTaskReward = vi.fn()
  render(
    <RewardRulesPage
      bonuses={bonuses}
      entries={entries}
      now={NOW}
      pointValue={pointValue}
      newTaskReward={newTaskReward}
      onChangeBonus={onChangeBonus}
      onChangePointValue={onChangePointValue}
      onChangeNewTaskReward={onChangeNewTaskReward}
      cases={cases}
    />,
  )
  return { user: userEvent.setup(), onChangeBonus, onChangePointValue, onChangeNewTaskReward }
}

describe('the reward for a new task (RWD-45)', () => {
  it('starts as none, and gives one point at a touch', async () => {
    const { user, onChangeNewTaskReward } = setup()

    await user.click(screen.getByRole('button', { name: 'Reward for a new task: No reward' }))

    expect(onChangeNewTaskReward).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('says what is set, steps it, and takes it away in one tap', async () => {
    const { user, onChangeNewTaskReward } = setup(NO_BONUSES, null, undefined, 3)

    await user.click(screen.getByRole('button', { name: 'Reward for a new task: 3 points' }))
    await user.click(screen.getByRole('button', { name: 'More points' }))
    expect(onChangeNewTaskReward).toHaveBeenLastCalledWith(4)

    await user.click(screen.getByRole('button', { name: 'Remove reward for new tasks' }))
    expect(onChangeNewTaskReward).toHaveBeenLastCalledWith(null)
  })
})

describe('the bonuses (RWD-27, RWD-29)', () => {
  it('shows where each stands, as Rewards does (RWD-20, RWD-39)', () => {
    const earned: RewardEntry[] = [{ taskId: BONUS_IDS.today, day: '2026-10-07', points: 5 }]
    setup({ today: 5, week: 40, month: null }, null, undefined, null, earned)

    const tiles = screen.getByRole('region', { name: 'Bonuses' }).querySelector('dl') as HTMLElement
    expect(tiles.className).toContain('grid-cols-3')
    expect(within(tiles).getByText('+5')).toBeTruthy()
    expect(within(tiles).getByText('earned')).toBeTruthy()
    expect(within(tiles).getByText('+40')).toBeTruthy()
    expect(within(tiles).getByText('all done = earned')).toBeTruthy()
    expect(within(tiles).getByText('no bonus')).toBeTruthy()
  })

  it('has one for Today, this week and this month, each saying what it earns', () => {
    setup({ today: 5, week: 40, month: null })

    expect(screen.getByRole('button', { name: 'Bonus for clearing Today: 5 points' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Bonus for clearing This week: 40 points' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Bonus for clearing This month: No bonus' })).toBeTruthy()
  })

  it('gives a period with no bonus one point at a touch, and steps it up to its own amount', async () => {
    const { user, onChangeBonus } = setup()

    await user.click(screen.getByRole('button', { name: 'Bonus for clearing This month: No bonus' }))
    expect(onChangeBonus).toHaveBeenCalledWith('month', 1)

    await user.click(screen.getByRole('button', { name: 'More points' }))
    expect(onChangeBonus).toHaveBeenLastCalledWith('month', 2)
  })

  it('takes a bonus away by stepping it down to nothing (RWD-27)', async () => {
    const { user, onChangeBonus } = setup({ ...NO_BONUSES, today: 1 })

    await user.click(screen.getByRole('button', { name: 'Bonus for clearing Today: 1 point' }))
    await user.click(screen.getByRole('button', { name: 'Fewer points' }))

    expect(onChangeBonus).toHaveBeenLastCalledWith('today', null)
  })
})

describe('what a point is worth (RWD-31)', () => {
  it('says nothing is set until something is', () => {
    setup()

    expect(screen.getByText(/points are counted in points alone/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Forget what a point is worth' })).toBeNull()
  })

  it('saves the rate as it is typed, in the currency beside it', async () => {
    const { user, onChangePointValue } = setup()

    await user.type(screen.getByLabelText('Money one point is worth'), '2')

    expect(onChangePointValue).toHaveBeenCalledExactlyOnceWith({ amount: 2, currency: 'UAH' })
  })

  it('saves a currency of its own', async () => {
    const { user, onChangePointValue } = setup(NO_BONUSES, createPointValue(2))
    const currency = screen.getByLabelText('What that money is')

    await user.clear(currency)
    await user.type(currency, 'PLN')

    expect(onChangePointValue).toHaveBeenLastCalledWith({ amount: 2, currency: 'PLN' })
  })

  it('saves nothing while the boxes do not say a rate yet', async () => {
    const { user, onChangePointValue } = setup()
    const currency = screen.getByLabelText('What that money is')

    await user.clear(currency)
    await user.type(screen.getByLabelText('Money one point is worth'), '0')

    expect(onChangePointValue).not.toHaveBeenCalled()
  })

  it('shows what is saved, and what a hundred points come to (RWD-32)', () => {
    setup(NO_BONUSES, createPointValue(2.5))

    expect((screen.getByLabelText('Money one point is worth') as HTMLInputElement).value).toBe('2.5')
    expect(screen.getByText(/100 points are 250 UAH/)).toBeTruthy()
  })

  it('forgets the rate, leaving the points counted in points (RWD-32)', async () => {
    const { user, onChangePointValue } = setup(NO_BONUSES, createPointValue(2.5))

    await user.click(screen.getByRole('button', { name: 'Forget what a point is worth' }))

    expect(onChangePointValue).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('puts a box saying something that is not a rate back to what is saved', async () => {
    const { user } = setup(NO_BONUSES, createPointValue(2.5))
    const amount = screen.getByLabelText('Money one point is worth') as HTMLInputElement

    await user.clear(amount)
    await user.tab()

    expect(amount.value).toBe('2.5')
  })
})

describe('Cases', () => {
  it('carries what Cases asks of a day, beside the other rules (CHST-7)', () => {
    setup(NO_BONUSES, null, <p>Tasks a day must ask for</p>)

    expect(screen.getByRole('region', { name: 'Cases' })).toBeTruthy()
    expect(screen.getByText('Tasks a day must ask for')).toBeTruthy()
  })

  it('shows no such section where there is nothing to put in it', () => {
    setup()

    expect(screen.queryByRole('region', { name: 'Cases' })).toBeNull()
  })
})
