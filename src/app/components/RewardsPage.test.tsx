// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BONUS_IDS,
  createPointValue,
  createPrize,
  createRedemption,
  NO_BONUSES,
  type PeriodBonuses,
  type PointValue,
  type Prize,
  type RewardEntry,
} from '../../core'
import { RewardsPage } from './RewardsPage'

/* How the points stand. RWD ids refer to wiki/rewards.md. */

const NOW = new Date(2026, 8, 17, 15, 0)

afterEach(cleanup)

const EARNED: RewardEntry[] = [
  { taskId: 'run', day: '2026-09-17', points: 20 },
  { taskId: 'read', day: '2026-09-16', points: 10 },
]
const CHOCOLATE = createPrize('Chocolate', 20, 'prize', NOW)
const PHONE = createPrize('A new phone', 5000, 'wish', NOW)

function setup({
  entries = EARNED,
  redemptions = [createRedemption(5, 'Coffee', 30, NOW)],
  prizes = [CHOCOLATE, PHONE] as readonly Prize[],
  bonuses = NO_BONUSES as PeriodBonuses,
  pointValue = null as PointValue | null,
} = {}) {
  const onOpenPrizes = vi.fn()
  const onOpenWishlist = vi.fn()
  const onOpenRules = vi.fn()
  render(
    <RewardsPage
      entries={entries}
      redemptions={redemptions}
      prizes={prizes}
      bonuses={bonuses}
      pointValue={pointValue}
      now={NOW}
      onOpenPrizes={onOpenPrizes}
      onOpenWishlist={onOpenWishlist}
      onOpenRules={onOpenRules}
    />,
  )
  return { user: userEvent.setup(), onOpenPrizes, onOpenWishlist, onOpenRules }
}

describe('the balance (RWD-17, RWD-32)', () => {
  it('is everything earned less everything redeemed', () => {
    setup()

    expect(screen.getByText('25')).toBeTruthy()
    expect(screen.getByText('points to spend')).toBeTruthy()
  })

  it('says what it is worth in money only once something says what a point is worth', () => {
    setup()
    expect(screen.queryByText(/worth/)).toBeNull()
    cleanup()

    setup({ pointValue: createPointValue(2.5) })
    expect(screen.getByText('worth 62.50 UAH')).toBeTruthy()
  })
})

describe('what finishing a period pays (RWD-30)', () => {
  it('says what the bonus is for, and offers to set one where there is none', async () => {
    const { user, onOpenRules } = setup()

    expect(screen.getByText(/An extra bonus on top of what the tasks themselves earn/)).toBeTruthy()
    expect(screen.getAllByText('no bonus')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Set a bonus' }))
    expect(onOpenRules).toHaveBeenCalled()
  })

  it('shows the three periods side by side, each with its amount and where it stands', () => {
    setup({
      bonuses: { today: 5, week: 40, month: 100 },
      entries: [...EARNED, { taskId: BONUS_IDS.today, day: '2026-09-17', points: 5 }],
    })

    const bonuses = screen.getByRole('region', { name: 'Bonuses' })
    // One row of three, not three rows: the three are one rule with three amounts.
    expect(bonuses.querySelector('dl')?.className).toContain('grid-cols-3')
    expect(within(bonuses).getByText('Today')).toBeTruthy()
    expect(within(bonuses).getByText('+5')).toBeTruthy()
    expect(within(bonuses).getByText('earned')).toBeTruthy()
    expect(within(bonuses).getByText('+40')).toBeTruthy()
    expect(within(bonuses).getAllByText('all done = earned')).toHaveLength(2)
  })
})

describe('what the balance reaches (RWD-37, RWD-40)', () => {
  it('names the prizes within reach, and what the wishlist is being saved up for', () => {
    setup()

    expect(screen.getByText('Within reach: Chocolate')).toBeTruthy()
    expect(screen.getByText(/Saving up for A new phone: 4975 points to go/)).toBeTruthy()
  })

  it('says nothing is within reach yet where nothing is', () => {
    setup({ entries: [{ taskId: 'run', day: '2026-09-17', points: 1 }], redemptions: [] })

    expect(screen.getByText('Nothing within reach yet.')).toBeTruthy()
  })

  it('offers to start a wishlist where there is none', async () => {
    const { user, onOpenWishlist } = setup({ prizes: [CHOCOLATE] })

    expect(screen.getByText('Nothing wished for yet.')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Add a wish' }))
    expect(onOpenWishlist).toHaveBeenCalled()
  })

  it('opens the prizes to spend points once something is within reach', async () => {
    const { user, onOpenPrizes } = setup()

    await user.click(screen.getByRole('button', { name: 'Spend points' }))

    expect(onOpenPrizes).toHaveBeenCalled()
  })
})
