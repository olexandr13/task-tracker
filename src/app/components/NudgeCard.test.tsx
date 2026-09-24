// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NudgeCard } from './NudgeCard'

/* The nudge on Settings (NUDGE-9 in wiki/nudges.md). */

afterEach(cleanup)

const SWITCH = 'Nudge me when nothing gets done'

describe('NudgeCard', () => {
  it('is a switch that says what it does, off to begin with (NUDGE-9)', () => {
    render(
      <NudgeCard on={false} quietHours={2} permission="default" onTurnOn={vi.fn()} onQuietHoursChange={vi.fn()} />,
    )

    const control = screen.getByRole('switch', { name: SWITCH })
    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('turns on with a click (NUDGE-9)', async () => {
    const user = userEvent.setup()
    const onTurnOn = vi.fn()
    render(
      <NudgeCard on={false} quietHours={2} permission="default" onTurnOn={onTurnOn} onQuietHoursChange={vi.fn()} />,
    )

    await user.click(screen.getByRole('switch', { name: SWITCH }))

    expect(onTurnOn).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('offers the spans once it is on, with the chosen one marked (NUDGE-9)', () => {
    render(
      <NudgeCard on quietHours={3} permission="granted" onTurnOn={vi.fn()} onQuietHoursChange={vi.fn()} />,
    )

    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['1', '2', '3', '4'])
    expect((screen.getByRole('radio', { name: '3h' }) as HTMLInputElement).checked).toBe(true)
  })

  it('picks a span with a click (NUDGE-9)', async () => {
    const user = userEvent.setup()
    const onQuietHoursChange = vi.fn()
    render(
      <NudgeCard on quietHours={2} permission="granted" onTurnOn={vi.fn()} onQuietHoursChange={onQuietHoursChange} />,
    )

    await user.click(screen.getByText('4h'))

    expect(onQuietHoursChange).toHaveBeenCalledExactlyOnceWith(4)
  })

  it('says so when the browser is blocking notifications (NUDGE-10)', () => {
    render(
      <NudgeCard on quietHours={2} permission="denied" onTurnOn={vi.fn()} onQuietHoursChange={vi.fn()} />,
    )

    expect(screen.getByText(/blocking notifications/)).not.toBeNull()
  })

  it('says nothing about the browser once it is allowed (NUDGE-10)', () => {
    render(
      <NudgeCard on quietHours={2} permission="granted" onTurnOn={vi.fn()} onQuietHoursChange={vi.fn()} />,
    )

    expect(screen.queryByText(/notifications/)).toBeNull()
  })

  it('keeps quiet about the browser while it is off (NUDGE-10)', () => {
    render(
      <NudgeCard on={false} quietHours={2} permission="denied" onTurnOn={vi.fn()} onQuietHoursChange={vi.fn()} />,
    )

    expect(screen.queryByText(/blocking notifications/)).toBeNull()
  })
})
