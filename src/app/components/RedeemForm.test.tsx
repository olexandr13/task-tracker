// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RedeemForm } from './RedeemForm'

/* Spending points. RWD ids refer to wiki/rewards.md. */

afterEach(cleanup)

function setup(balance: number) {
  const user = userEvent.setup()
  const onRedeem = vi.fn()
  render(<RedeemForm balance={balance} onRedeem={onRedeem} />)
  return { user, onRedeem }
}

const points = () => screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Points to redeem' })
const note = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'What for' })
const redeem = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Redeem' })

describe('RedeemForm', () => {
  it('redeems the points for what the note says, on the button or Enter, and clears (RWD-15)', async () => {
    const { user, onRedeem } = setup(10)

    await user.type(points(), '4')
    await user.type(note(), 'coffee')
    await user.click(redeem())

    expect(onRedeem).toHaveBeenLastCalledWith(4, 'coffee')
    expect([points().value, note().value]).toEqual(['', ''])

    await user.type(points(), '2')
    await user.type(note(), 'cake{Enter}')

    expect(onRedeem).toHaveBeenLastCalledWith(2, 'cake')
  })

  it('needs a note saying what for (RWD-15)', async () => {
    const { user, onRedeem } = setup(10)

    await user.type(points(), '4')
    await user.type(note(), '   {Enter}')

    expect(redeem().disabled).toBe(true)
    expect(onRedeem).not.toHaveBeenCalled()
  })

  it('will not spend more than there is, and says how much there is (RWD-16)', async () => {
    const { user, onRedeem } = setup(3)

    await user.type(points(), '4')
    await user.type(note(), 'coffee{Enter}')

    expect(redeem().disabled).toBe(true)
    expect(onRedeem).not.toHaveBeenCalled()
    expect(screen.getByText('You have 3 points.')).toBeDefined()
  })

  it('says there is nothing to redeem with no points (RWD-16)', () => {
    setup(0)

    expect(screen.getByText(/^Nothing to redeem yet/)).toBeDefined()
    expect(redeem().disabled).toBe(true)
  })
})
