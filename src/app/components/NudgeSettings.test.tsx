// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NUDGE_WINDOW, type NudgeWindow, type QuietHours } from '../../core'
import type { NotifyPermission } from '../browserNotification'
import { NudgeSettings } from './NudgeSettings'

/* What there is to set about the nudge, on its mode's page. NUDGE ids refer to
   wiki/nudges.md, MODE ids to wiki/modes.md. */

/** Twenty past two, so a face with no hour would open on three in the afternoon. */
const NOW = new Date(2026, 8, 16, 14, 20)

const HOURS = 'Only at certain hours'

afterEach(cleanup)

function setup(
  over: {
    quietHours?: QuietHours
    window?: NudgeWindow | null
    permission?: NotifyPermission
    onQuietHoursChange?: (hours: QuietHours) => void
  } = {},
) {
  /** The settings as they are used: what is picked is what they then show. */
  function Holder() {
    const [window, setWindow] = useState<NudgeWindow | null>(over.window ?? null)
    return (
      <>
        <NudgeSettings
          quietHours={over.quietHours ?? 2}
          window={window}
          permission={over.permission ?? 'granted'}
          now={NOW}
          onQuietHoursChange={over.onQuietHoursChange ?? vi.fn()}
          onWindowChange={setWindow}
        />
        <p>Hours: {window === null ? 'any' : `${window.from}–${window.to}`}</p>
      </>
    )
  }

  const user = userEvent.setup()
  render(<Holder />)
  return user
}

const hours = (reading: string) => screen.getByText(`Hours: ${reading}`)

describe('the span it waits for', () => {
  it('offers the spans, with the chosen one marked (NUDGE-9)', () => {
    setup({ quietHours: 3 })

    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['1', '2', '3', '4'])
    expect((screen.getByRole('radio', { name: '3h' }) as HTMLInputElement).checked).toBe(true)
  })

  it('picks a span with a click (NUDGE-9)', async () => {
    const onQuietHoursChange = vi.fn()
    const user = setup({ onQuietHoursChange })

    await user.click(screen.getByText('4h'))

    expect(onQuietHoursChange).toHaveBeenCalledExactlyOnceWith(4)
  })
})

describe('the hours it may speak in', () => {
  it('keeps to no hours until it is asked to, and then to waking ones (NUDGE-12)', async () => {
    const user = setup()

    const control = screen.getByRole('switch', { name: HOURS })
    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('button', { name: /From/ })).toBeNull()

    await user.click(control)

    expect(hours('09:00–22:00')).toBeDefined()
    expect(screen.getByRole('button', { name: /From/ }).textContent).toContain('09:00')
    expect(screen.getByRole('button', { name: /To/ }).textContent).toContain('22:00')
  })

  it('gives the hours up again, back to any hour (NUDGE-12)', async () => {
    const user = setup({ window: DEFAULT_NUDGE_WINDOW })

    await user.click(screen.getByRole('switch', { name: HOURS }))

    expect(hours('any')).toBeDefined()
    expect(screen.queryByRole('button', { name: /From/ })).toBeNull()
  })

  it('picks an end off the app’s own clock face (NUDGE-12, DUE-24)', async () => {
    const user = setup({ window: DEFAULT_NUDGE_WINDOW })

    await user.click(screen.getByRole('button', { name: /To/ }))
    await user.click(screen.getByRole('button', { name: '23' }))

    expect(hours('09:00–23:00')).toBeDefined()
  })

  it('closes the clock face on Escape, keeping the hour picked (NUDGE-12)', async () => {
    const user = setup({ window: DEFAULT_NUDGE_WINDOW })

    await user.click(screen.getByRole('button', { name: /From/ }))
    await user.click(screen.getByRole('button', { name: '11' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(hours('11:00–22:00')).toBeDefined()
  })

  it('says outright which stretch stays quiet (NUDGE-12)', async () => {
    const user = setup({ window: { from: '09:00', to: '22:00' } })

    expect(screen.getByText('Nothing is said between 22:00 and 09:00.')).toBeDefined()

    // Both ends at the same hour shut nothing out, and say so rather than naming
    // a stretch that is not one.
    await user.click(screen.getByRole('button', { name: /To/ }))
    await user.click(screen.getByRole('button', { name: '09' }))

    expect(screen.getByText(/Both ends at 09:00 is any hour at all/)).toBeDefined()
  })
})

describe('what the browser allows', () => {
  it('says so when the browser is blocking notifications (NUDGE-10)', () => {
    setup({ permission: 'denied' })

    expect(screen.getByText(/blocking notifications/)).toBeDefined()
  })

  it('says nothing about the browser once it is allowed (NUDGE-10)', () => {
    setup({ permission: 'granted' })

    expect(screen.queryByText(/notifications/)).toBeNull()
  })
})
