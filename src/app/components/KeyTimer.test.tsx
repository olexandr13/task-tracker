// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KeyTimer } from './KeyTimer'

/* The countdown on a case on its way: the Drop, and Weekly. CHST ids refer to wiki/cases.md. */

const DROP = 'Time until the Drop'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function timerText(name = DROP): string {
  return screen.getByRole('timer', { name }).textContent ?? ''
}

describe('KeyTimer', () => {
  it('counts down in whole minutes, rounded up, with no seconds (CHST-29)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0, 0))
    const at = new Date(2026, 9, 4, 15, 1, 5)
    render(<KeyTimer at={at} label={DROP} />)

    expect(timerText()).toContain('2m')
    expect(timerText()).not.toMatch(/\ds/)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(timerText()).toContain('1m')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(59_000)
    })

    expect(timerText()).toContain('1m')
  })

  it('shows hours and minutes while an hour or more is left (CHST-29)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0, 0))

    render(<KeyTimer at={new Date(2026, 9, 4, 17, 0, 0)} label={DROP} />)

    expect(timerText()).toContain('2h 0m')
  })

  it('keeps counting when the same arrival is handed over as a new Date (CHST-28)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0, 0))
    const at = new Date(2026, 9, 4, 15, 1, 5)
    const { rerender } = render(<KeyTimer at={at} label={DROP} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500)
    })
    rerender(<KeyTimer at={new Date(at.getTime())} label={DROP} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(timerText()).toContain('1m')
  })

  it('counts down in days and hours while a day or more is left, as Weekly does (CHST-30)', async () => {
    vi.useFakeTimers()
    // Tuesday morning, and Weekly arrives at midnight on Monday.
    vi.setSystemTime(new Date(2026, 9, 6, 7, 50, 0))
    render(<KeyTimer at={new Date(2026, 9, 12)} label="Time until Weekly" />)

    expect(timerText('Time until Weekly')).toContain('5d 16h')

    // Sunday evening, under a day away: hours and minutes, as the Drop's.
    vi.setSystemTime(new Date(2026, 9, 11, 20, 30, 0))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(timerText('Time until Weekly')).toContain('3h 30m')
  })

  it('shows nothing when there is no arrival to wait for', () => {
    render(<KeyTimer at={null} label={DROP} />)

    expect(screen.queryByRole('timer')).toBeNull()
  })

  it('shows nothing once the arrival has passed, the case being ready by then', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0, 0))

    render(<KeyTimer at={new Date(2026, 9, 4, 14, 59, 0)} label={DROP} />)

    expect(screen.queryByRole('timer')).toBeNull()
  })
})
