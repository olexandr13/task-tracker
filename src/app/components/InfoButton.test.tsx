// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { InfoButton } from './InfoButton'

afterEach(cleanup)

describe('InfoButton', () => {
  it('holds what it explains until pressed (UI-73)', () => {
    render(
      <InfoButton label="Work–rest balance">
        <p>See where your logged time went.</p>
      </InfoButton>,
    )

    expect(screen.queryByText('See where your logged time went.')).toBeNull()
    expect(screen.getByRole('button', { name: 'About Work–rest balance' })).toBeDefined()
  })

  it('opens a sheet with it on a press, named for what it explains', async () => {
    const user = userEvent.setup()
    render(
      <InfoButton label="Work–rest balance">
        <p>See where your logged time went.</p>
      </InfoButton>,
    )

    await user.click(screen.getByRole('button', { name: 'About Work–rest balance' }))

    expect(screen.getByRole('dialog', { name: 'Work–rest balance' })).toBeDefined()
    expect(screen.getByText('See where your logged time went.')).toBeDefined()
  })

  it('heads the sheet with its own heading where it has one, keeping the button named for what it explains', async () => {
    const user = userEvent.setup()
    render(
      <InfoButton label="Cases" heading="How much each case pays">
        <p>Min: 0 points.</p>
      </InfoButton>,
    )

    await user.click(screen.getByRole('button', { name: 'About Cases' }))

    expect(screen.getByRole('dialog', { name: 'How much each case pays' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'How much each case pays' })).toBeDefined()
  })

  it('closes on Escape, as any sheet does (UI-71)', async () => {
    const user = userEvent.setup()
    render(
      <InfoButton label="Work–rest balance">
        <p>See where your logged time went.</p>
      </InfoButton>,
    )

    await user.click(screen.getByRole('button', { name: 'About Work–rest balance' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
