// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RewardsView } from '../view'
import { RewardsNav } from './RewardsNav'

/* The strip across the rewards pages on a phone. RWD ids refer to wiki/rewards.md. */

afterEach(cleanup)

function setup(view: RewardsView) {
  const onChange = vi.fn()
  render(<RewardsNav view={view} onChange={onChange} />)
  return { user: userEvent.setup(), onChange }
}

describe('RewardsNav (RWD-30)', () => {
  it('lists every rewards page, the one you are on marked', () => {
    setup('rewards/wishlist')

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Rewards',
      'History',
      'Prizes',
      'Wishlist',
      'Rules',
    ])
    expect(screen.getByRole('button', { name: 'Wishlist' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Rules' }).getAttribute('aria-current')).toBeNull()
  })

  it('goes to another of them', async () => {
    const { user, onChange } = setup('rewards')

    await user.click(screen.getByRole('button', { name: 'History' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('rewards/history')
  })

  it('is a phone’s alone: a wide screen has them in the sidebar (UI-30)', () => {
    setup('rewards')

    expect(screen.getByRole('navigation', { name: 'Rewards' }).className).toContain('md:hidden')
  })
})
