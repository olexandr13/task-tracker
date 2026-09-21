// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import { HabitViewOptionsMenu } from './HabitViewOptionsMenu'

/* The Habits page's View button and its panel. HAB and UI ids refer to the wiki. */

afterEach(cleanup)

function setup(options: HabitViewOptions = { showDetails: false }, onChange = vi.fn()) {
  const user = userEvent.setup()
  render(<HabitViewOptionsMenu options={options} onChange={onChange} />)
  return { user, onChange }
}

const viewButton = () => screen.getByRole('button', { name: 'View settings' })
const detailsSwitch = () => screen.getByRole('switch', { name: 'Show habit details by default' })

describe('the Habits View button', () => {
  it('opens a panel holding Show habit details by default, reporting whether it is on (HAB-23, UI-46)', async () => {
    const { user } = setup({ showDetails: true })

    expect(viewButton().getAttribute('aria-expanded')).toBe('false')
    await user.click(viewButton())

    expect(viewButton().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'View settings' })).toBeDefined()
    expect(detailsSwitch().getAttribute('aria-checked')).toBe('true')
  })

  it('hands a change straight on and stays open for the next (HAB-23)', async () => {
    const { user, onChange } = setup()

    await user.click(viewButton())
    await user.click(detailsSwitch())

    expect(onChange).toHaveBeenCalledWith({ showDetails: true })
    expect(screen.getByRole('dialog', { name: 'View settings' })).toBeDefined()
  })

  it('says what the option does (HAB-23)', async () => {
    const { user } = setup()

    await user.click(viewButton())

    expect(detailsSwitch().getAttribute('aria-describedby')).not.toBeNull()
    expect(screen.getByText('Start each habit open, with its numbers and days in view')).toBeDefined()
  })
})
