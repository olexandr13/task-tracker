// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalDay } from '../../core'
import { DateCalendar } from './DateCalendar'

/* The month calendar the schedule panel picks any other day from. DUE ids refer to the wiki. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

function setup(selected: LocalDay | null = null, opensOn?: LocalDay | null) {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(<DateCalendar selected={selected} opensOn={opensOn} now={WED_16} onSelect={onSelect} />)
  return { user, onSelect }
}

const grid = () => screen.getByRole('grid')
const day = (name: string) => screen.getByRole('button', { name })
/** The one day Tab stops on. */
const inReach = () => grid().querySelector('[tabindex="0"]')

describe('DateCalendar', () => {
  it('lays the month out Monday to Sunday, six weeks, headed by its name (DUE-15)', () => {
    setup()

    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
    expect(screen.getAllByRole('columnheader').map((header) => header.getAttribute('aria-label'))).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ])
    expect(screen.getAllByRole('gridcell')).toHaveLength(42)
    expect(screen.getAllByRole('gridcell')[0].textContent).toBe('31')
  })

  it('marks today, and the chosen day as selected (DUE-15)', () => {
    setup('2026-09-20')

    expect(day('Wednesday, September 16, 2026').getAttribute('aria-current')).toBe('date')
    expect(screen.getByRole('gridcell', { selected: true }).textContent).toBe('20')
  })

  it('picks a day with a click, days gone by and those of the months around included (DUE-15)', async () => {
    const { user, onSelect } = setup()

    await user.click(day('Monday, September 14, 2026'))
    await user.click(day('Saturday, October 3, 2026'))

    expect(onSelect.mock.calls).toEqual([['2026-09-14'], ['2026-10-03']])
  })

  it('pages from month to month, and back to today\'s (DUE-15)', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Next month' }))
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Go to today' }))
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
  })

  it('opens on the month of the day it is given, whether or not that day is chosen (DUE-15)', () => {
    setup(null, '2027-01-04')

    expect(screen.getByRole('grid', { name: 'January 2027' })).toBeDefined()
    expect(inReach()?.getAttribute('data-day')).toBe('2027-01-04')
  })

  it('is one Tab stop, on the chosen day or else today (DUE-16)', () => {
    setup('2026-09-20')
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    expect(inReach()?.getAttribute('data-day')).toBe('2026-09-20')
    cleanup()

    setup()
    expect(inReach()?.getAttribute('data-day')).toBe('2026-09-16')
  })

  it('moves a day or a week with the arrow keys, the focus going along (DUE-16)', async () => {
    const { user } = setup()

    day('Wednesday, September 16, 2026').focus()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(document.activeElement).toBe(day('Thursday, September 24, 2026'))

    await user.keyboard('{ArrowLeft}{ArrowUp}{ArrowUp}')
    expect(document.activeElement).toBe(day('Wednesday, September 9, 2026'))
  })

  it('moves to the ends of the week with Home and End (DUE-16)', async () => {
    const { user } = setup()

    day('Wednesday, September 16, 2026').focus()
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(day('Monday, September 14, 2026'))

    await user.keyboard('{End}')
    expect(document.activeElement).toBe(day('Sunday, September 20, 2026'))
  })

  it('follows the keys into the next month, and pages a month or a year (DUE-16)', async () => {
    const { user } = setup('2026-09-30')

    day('Wednesday, September 30, 2026').focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeDefined()
    expect(document.activeElement).toBe(day('Wednesday, October 7, 2026'))

    await user.keyboard('{PageUp}')
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
    expect(document.activeElement).toBe(day('Monday, September 7, 2026'))

    await user.keyboard('{Shift>}{PageDown}{/Shift}')
    expect(screen.getByRole('grid', { name: 'September 2027' })).toBeDefined()
    expect(document.activeElement).toBe(day('Tuesday, September 7, 2027'))
  })

  it('picks the day in reach with Enter (DUE-16)', async () => {
    const { user, onSelect } = setup()

    day('Wednesday, September 16, 2026').focus()
    await user.keyboard('{ArrowRight}{Enter}')

    expect(onSelect).toHaveBeenCalledWith('2026-09-17')
  })
})
