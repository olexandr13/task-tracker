// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ViewSettingsCard } from './ViewSettingsCard'

/* The view settings on Settings (UI-35 in wiki/interface.md, HAB-23 in wiki/habits.md). */

afterEach(cleanup)

const SWITCH = 'Show habit details by default'

describe('ViewSettingsCard', () => {
  it('holds the habits switch under its heading, reporting whether it is on (UI-35, HAB-23)', () => {
    render(<ViewSettingsCard habitView={{ showDetails: true }} onHabitViewChange={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'View settings' })).not.toBeNull()
    expect(screen.getByRole('switch', { name: SWITCH }).getAttribute('aria-checked')).toBe('true')
  })

  it('hands a change straight on (HAB-23)', async () => {
    const user = userEvent.setup()
    const onHabitViewChange = vi.fn()
    render(<ViewSettingsCard habitView={{ showDetails: false }} onHabitViewChange={onHabitViewChange} />)

    await user.click(screen.getByRole('switch', { name: SWITCH }))

    expect(onHabitViewChange).toHaveBeenCalledExactlyOnceWith({ showDetails: true })
  })

  it('names the switch alone, with no line under it (HAB-23)', () => {
    render(<ViewSettingsCard habitView={{ showDetails: false }} onHabitViewChange={vi.fn()} />)

    const control = screen.getByRole('switch', { name: SWITCH })
    expect(control.getAttribute('aria-describedby')).toBeNull()
    expect(control.textContent).toBe(SWITCH)
  })

  it('draws no picture beside the name (HAB-23)', () => {
    render(<ViewSettingsCard habitView={{ showDetails: false }} onHabitViewChange={vi.fn()} />)

    const control = screen.getByRole('switch', { name: SWITCH })
    expect(control.querySelector('svg')).toBeNull()
  })
})
