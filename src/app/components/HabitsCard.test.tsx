// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HabitsCard } from './HabitsCard'

/* The habits on Settings (HAB-23 in wiki/habits.md). */

afterEach(cleanup)

const SWITCH = 'Show habit details by default'

describe('HabitsCard', () => {
  it('is one switch under its heading, reporting whether it is on (HAB-23)', () => {
    render(<HabitsCard options={{ showDetails: true }} onChange={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Habits' })).not.toBeNull()
    expect(screen.getByRole('switch', { name: SWITCH }).getAttribute('aria-checked')).toBe('true')
  })

  it('hands a change straight on (HAB-23)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HabitsCard options={{ showDetails: false }} onChange={onChange} />)

    await user.click(screen.getByRole('switch', { name: SWITCH }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ showDetails: true })
  })

  it('names the switch alone, with no line under it (HAB-23)', () => {
    render(<HabitsCard options={{ showDetails: false }} onChange={vi.fn()} />)

    const control = screen.getByRole('switch', { name: SWITCH })
    expect(control.getAttribute('aria-describedby')).toBeNull()
    expect(control.textContent).toBe(SWITCH)
  })
})
