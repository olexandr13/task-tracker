import { describe, expect, it } from 'vitest'
import { calendarWeeks, monthOf, offsetMonth, startOfWeek } from './calendarMonth'

/* The days a month calendar lays out (DUE-15). */

describe('monthOf', () => {
  it('is the first day of the day\'s month', () => {
    expect(monthOf('2026-09-16')).toBe('2026-09-01')
    expect(monthOf('2026-09-01')).toBe('2026-09-01')
  })
})

describe('startOfWeek', () => {
  it('is the Monday on or before the day, a Sunday closing the week before it', () => {
    expect(startOfWeek('2026-09-16')).toBe('2026-09-14')
    expect(startOfWeek('2026-09-14')).toBe('2026-09-14')
    expect(startOfWeek('2026-09-20')).toBe('2026-09-14')
    expect(startOfWeek('2026-10-01')).toBe('2026-09-28')
  })
})

describe('offsetMonth', () => {
  it('moves by whole months, across years', () => {
    expect(offsetMonth('2026-09-16', 1)).toBe('2026-10-16')
    expect(offsetMonth('2026-12-05', 1)).toBe('2027-01-05')
    expect(offsetMonth('2026-01-05', -1)).toBe('2025-12-05')
    expect(offsetMonth('2026-09-16', 12)).toBe('2027-09-16')
  })

  it('keeps a late day inside a shorter month', () => {
    expect(offsetMonth('2026-01-31', 1)).toBe('2026-02-28')
    expect(offsetMonth('2028-01-31', 1)).toBe('2028-02-29')
    expect(offsetMonth('2026-03-31', -1)).toBe('2026-02-28')
  })
})

describe('calendarWeeks', () => {
  it('lays a month out in six weeks from the Monday before its 1st', () => {
    const weeks = calendarWeeks('2026-09-16')

    expect(weeks).toHaveLength(6)
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0][0]).toBe('2026-08-31')
    expect(weeks[0][1]).toBe('2026-09-01')
    expect(weeks[5][6]).toBe('2026-10-11')
  })

  it('starts on the 1st itself when the month opens on a Monday', () => {
    expect(calendarWeeks('2026-06-10')[0][0]).toBe('2026-06-01')
  })
})
