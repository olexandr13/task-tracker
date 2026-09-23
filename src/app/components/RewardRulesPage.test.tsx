// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPointValue, NO_BONUSES, type PeriodBonuses, type PointValue } from '../../core'
import { RewardRulesPage } from './RewardRulesPage'

/* The rewards rules page. RWD ids refer to wiki/rewards.md. */

afterEach(cleanup)

function setup(bonuses: PeriodBonuses = NO_BONUSES, pointValue: PointValue | null = null) {
  const onChangeBonus = vi.fn()
  const onChangePointValue = vi.fn()
  render(
    <RewardRulesPage
      bonuses={bonuses}
      pointValue={pointValue}
      onChangeBonus={onChangeBonus}
      onChangePointValue={onChangePointValue}
    />,
  )
  return { user: userEvent.setup(), onChangeBonus, onChangePointValue }
}

describe('the bonuses (RWD-27, RWD-29)', () => {
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
