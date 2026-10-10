// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHECK_IN_WINDOW } from '../../core'
import { CheckInSettings } from './CheckInSettings'

/* The Check-in's settings, on its page. CHECKIN ids refer to wiki/check-ins.md. */

afterEach(cleanup)

const NOW = new Date(2026, 9, 2, 15, 20)

describe('CheckInSettings (CHECKIN-2)', () => {
  it('shows the hours asked about, and the stretch it asks nothing about', () => {
    render(
      <CheckInSettings window={DEFAULT_CHECK_IN_WINDOW} permission="granted" now={NOW} onWindowChange={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /From/ }).textContent).toContain('09:00')
    expect(screen.getByRole('button', { name: /To/ }).textContent).toContain('22:00')
    expect(screen.getByText('It asks nothing about the hours between 22:00 and 09:00.')).toBeDefined()
  })

  it('picks an hour on the hour, with no minutes to set', async () => {
    const onWindowChange = vi.fn()
    render(
      <CheckInSettings window={DEFAULT_CHECK_IN_WINDOW} permission="granted" now={NOW} onWindowChange={onWindowChange} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /From/ }))
    expect(screen.queryByRole('button', { name: /^Minutes/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '08' }))
    expect(onWindowChange).toHaveBeenCalledExactlyOnceWith({ from: '08:00', to: '22:00' })
  })

  it('says what a browser blocking notifications misses (CHECKIN-5)', () => {
    render(<CheckInSettings window={DEFAULT_CHECK_IN_WINDOW} permission="denied" now={NOW} onWindowChange={vi.fn()} />)

    expect(screen.getByText(/This browser is blocking notifications, so check-ins only show on screen/)).toBeDefined()
  })
})
