// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHECK_IN_WINDOW } from '../../core'
import { CheckInDevice } from './CheckInDevice'
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

describe('CheckInDevice (CHECKIN-11, CHECKIN-12)', () => {
  function setUp(over: Partial<Parameters<typeof CheckInDevice>[0]> = {}) {
    const handlers = { onTurnOn: vi.fn(), onTurnOff: vi.fn(), onSendTest: vi.fn() }
    render(<CheckInDevice support="supported" on={false} busy={false} outcome={null} {...handlers} {...over} />)
    return handlers
  }

  const toggle = () => screen.getByRole('switch', { name: 'Notify this device when PickMe is closed' })

  it('turns this device on and off', async () => {
    const { onTurnOn } = setUp()
    await userEvent.click(toggle())
    expect(onTurnOn).toHaveBeenCalledOnce()
    cleanup()

    const { onTurnOff, onSendTest } = setUp({ on: true })
    expect(toggle().getAttribute('aria-checked')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Send a test' }))
    expect(onSendTest).toHaveBeenCalledOnce()
    await userEvent.click(toggle())
    expect(onTurnOff).toHaveBeenCalledOnce()
  })

  it('says why a browser cannot be reached, and says it again when pressed, rather than turning on', async () => {
    const { onTurnOn } = setUp({ support: 'install-first' })

    expect(screen.getByText(/add PickMe to the Home Screen first/)).toBeDefined()
    expect(screen.queryByRole('alert')).toBeNull()
    await userEvent.click(toggle())
    expect(screen.getByRole('alert').textContent).toContain('add PickMe to the Home Screen first')
    expect(onTurnOn).not.toHaveBeenCalled()
  })

  it('tells a guest to sign in, and the development server that it has no worker', () => {
    setUp({ support: 'guest' })
    expect(screen.getByText('Sign in with Google to get check-ins while PickMe is closed.')).toBeDefined()
    cleanup()

    setUp({ support: 'no-worker' })
    expect(screen.getByText(/not on the development server/)).toBeDefined()
  })

  it('says what came of a test', () => {
    setUp({ on: true, outcome: 'test-sent' })
    expect(screen.getByRole('status').textContent).toBe('Test sent. It should arrive in a few seconds, even if you close PickMe now.')
  })
})
