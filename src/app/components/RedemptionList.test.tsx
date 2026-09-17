// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Redemption } from '../../core'
import { RedemptionList } from './RedemptionList'

/* What points went on. RWD ids refer to wiki/rewards.md, UI ids to wiki/interface.md. */

const NOW = new Date(2026, 8, 17, 15, 0)

const COFFEE: Redemption = { id: 'coffee', points: 3, note: 'coffee', redeemedAt: new Date(2026, 8, 17, 9, 0).toISOString() }
const CINEMA: Redemption = { id: 'cinema', points: 20, note: 'cinema', redeemedAt: new Date(2026, 8, 2, 20, 0).toISOString() }

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function setup(redemptions: readonly Redemption[]) {
  const user = userEvent.setup()
  const onRemove = vi.fn()
  render(<RedemptionList redemptions={redemptions} now={NOW} onRemove={onRemove} />)
  return { user, onRemove }
}

describe('RedemptionList', () => {
  it('shows each redemption: its day, what it was for and its points (RWD-18)', () => {
    setup([COFFEE, CINEMA])
    const rows = screen.getAllByRole('listitem')

    expect(within(rows[0]).getByText('Today')).toBeDefined()
    expect(within(rows[0]).getByText('coffee')).toBeDefined()
    expect(within(rows[0]).getByLabelText('3 points redeemed')).toBeDefined()
    expect(within(rows[1]).getByText('Sep 2')).toBeDefined()
  })

  it('says when nothing has been redeemed', () => {
    setup([])

    expect(screen.getByText('Nothing redeemed yet.')).toBeDefined()
  })

  it('deletes a redemption only once that is confirmed (RWD-18, UI-38)', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { user, onRemove } = setup([COFFEE])
    const remove = screen.getByRole('button', { name: 'Delete the redemption "coffee"' })

    await user.click(remove)
    expect(onRemove).not.toHaveBeenCalled()

    await user.click(remove)
    expect(confirm).toHaveBeenLastCalledWith('Delete "coffee"? Its 3 points go back to the balance.')
    expect(onRemove).toHaveBeenCalledWith('coffee')
  })
})
