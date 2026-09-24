import { describe, expect, it } from 'vitest'
import { InvalidDayError, daysBetween, isLocalDay, offsetDay, startOfLocalDay, toLocalDay } from './day'

describe('toLocalDay', () => {
  it('names the local day a moment falls in, padded', () => {
    expect(toLocalDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toLocalDay(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })
})

describe('isLocalDay', () => {
  it('accepts a day that exists', () => {
    expect(isLocalDay('2026-09-16')).toBe(true)
    expect(isLocalDay('2028-02-29')).toBe(true)
  })

  it('refuses days that do not exist, and anything not written YYYY-MM-DD', () => {
    expect(isLocalDay('2026-02-29')).toBe(false)
    expect(isLocalDay('2026-13-01')).toBe(false)
    expect(isLocalDay('2026-9-16')).toBe(false)
    expect(isLocalDay('2026-09-16T10:00')).toBe(false)
    expect(isLocalDay('')).toBe(false)
  })
})

describe('startOfLocalDay', () => {
  it('is local midnight, and reads back as the same day', () => {
    const start = startOfLocalDay('2026-09-16')

    expect(start).toEqual(new Date(2026, 8, 16))
    expect(toLocalDay(start)).toBe('2026-09-16')
  })

  it('throws on something that is not a day', () => {
    expect(() => startOfLocalDay('2026-02-30')).toThrow(InvalidDayError)
  })
})

describe('offsetDay', () => {
  it('steps across the end of a month and a year, both ways', () => {
    expect(offsetDay('2026-09-30', 1)).toBe('2026-10-01')
    expect(offsetDay('2026-12-31', 1)).toBe('2027-01-01')
    expect(offsetDay('2026-03-01', -1)).toBe('2026-02-28')
    expect(offsetDay('2026-09-16', 7)).toBe('2026-09-23')
  })

  it('keeps whole days over a daylight saving change', () => {
    // Whichever zone the tests run in, a calendar step is a day, not 24 hours.
    expect(offsetDay('2026-03-28', 2)).toBe('2026-03-30')
    expect(offsetDay('2026-10-24', 2)).toBe('2026-10-26')
  })
})

describe('daysBetween', () => {
  it('counts the days from one day to another, and back', () => {
    expect(daysBetween('2026-09-16', '2026-09-23')).toBe(7)
    expect(daysBetween('2026-09-23', '2026-09-16')).toBe(-7)
    expect(daysBetween('2026-09-16', '2026-09-16')).toBe(0)
  })

  it('counts across the end of a month and a year', () => {
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
  })

  it('counts whole days over a daylight saving change', () => {
    // A day short or long of 24 hours is still one day.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('throws on something that is not a day', () => {
    expect(() => daysBetween('2026-02-30', '2026-03-01')).toThrow(InvalidDayError)
  })
})
