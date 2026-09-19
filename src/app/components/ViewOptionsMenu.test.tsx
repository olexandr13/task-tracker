// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ViewOptions } from '../../storage/viewOptionsRepository'
import { ViewOptionsMenu } from './ViewOptionsMenu'

/* The View button and its panel. UI ids refer to wiki/interface.md. */

afterEach(cleanup)

function setup(options: ViewOptions = { showDetails: false }, onChange = vi.fn()) {
  const user = userEvent.setup()
  render(<ViewOptionsMenu options={options} onChange={onChange} />)
  return { user, onChange }
}

const viewButton = () => screen.getByRole('button', { name: 'View' })
const detailsSwitch = () => screen.getByRole('switch', { name: 'Show task details' })

describe('the View button', () => {
  it('opens a panel holding Show task details, reporting whether it is on (UI-41, UI-42)', async () => {
    const { user } = setup({ showDetails: true })

    expect(viewButton().getAttribute('aria-expanded')).toBe('false')
    await user.click(viewButton())

    expect(viewButton().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'View' })).toBeDefined()
    expect(detailsSwitch().getAttribute('aria-checked')).toBe('true')
  })

  it('hands a change straight on and stays open for the next (UI-42)', async () => {
    const { user, onChange } = setup()

    await user.click(viewButton())
    await user.click(detailsSwitch())

    expect(onChange).toHaveBeenCalledWith({ showDetails: true })
    expect(screen.getByRole('dialog', { name: 'View' })).toBeDefined()
  })

  it('says what the option does (UI-42)', async () => {
    const { user } = setup()

    await user.click(viewButton())

    expect(detailsSwitch().getAttribute('aria-describedby')).not.toBeNull()
    expect(screen.getByText('Date, reward, time goal and other details under every task')).toBeDefined()
  })

  it('closes on Escape and on a click outside (UI-9)', async () => {
    const { user } = setup()

    await user.click(viewButton())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(viewButton())
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
