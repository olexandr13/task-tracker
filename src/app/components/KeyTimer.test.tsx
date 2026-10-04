// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KeyTimer } from './KeyTimer'

/* The countdown on the daily case. CHST ids refer to wiki/cases.md. */

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function timerText(): string {
  return screen.getByRole('timer', { name: 'Time until the Drop' }).textContent ?? ''
}

describe('KeyTimer', () => {
  it('counts down every second until the daily case arrives (CHST-28)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0, 0))
    const at = new Date(2026, 9, 4, 15, 1, 5)
    render(<KeyTimer at={at} />)

    expect(timerText()).toContain('1m 5s')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(timerText()).toContain('1m 4s')
  })

  it('keeps counting when the same arrival is handed over as a new Date (CHST-28)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0, 0))
    const at = new Date(2026, 9, 4, 15, 1, 5)
    const { rerender } = render(<KeyTimer at={at} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    rerender(<KeyTimer at={new Date(at.getTime())} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(timerText()).toContain('1m 4s')
  })

  it('shows nothing when there is no arrival to wait for', () => {
    render(<KeyTimer at={null} />)

    expect(screen.queryByRole('timer')).toBeNull()
  })

  it('shows nothing when the arrival is another day (CHST-28)', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    render(<KeyTimer at={tomorrow} />)

    expect(screen.queryByRole('timer')).toBeNull()
  })
})
