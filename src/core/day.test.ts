import { describe, expect, it } from 'vitest'
import {
  InvalidDayError,
  InvalidTimeOfDayError,
  atLocalTime,
  daysBetween,
  isLocalDay,
  isLocalTime,
  offsetDay,
  startOfLocalDay,
  toLocalDay,
  toLocalTime,
} from './day'

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

describe('isLocalTime', () => {
  it('accepts an hour that exists, at both ends of the clock', () => {
    expect(isLocalTime('00:00')).toBe(true)
    expect(isLocalTime('09:00')).toBe(true)
    expect(isLocalTime('23:59')).toBe(true)
  })

  it('refuses hours that do not exist, and anything not written HH:MM', () => {
    expect(isLocalTime('24:00')).toBe(false)
    expect(isLocalTime('09:60')).toBe(false)
    expect(isLocalTime('9:00')).toBe(false)
    expect(isLocalTime('09:00:00')).toBe(false)
    expect(isLocalTime('')).toBe(false)
  })
})

describe('toLocalTime', () => {
  it('names the hour a moment falls at, padded and to the minute', () => {
    expect(toLocalTime(new Date(2026, 8, 16, 9, 5, 30))).toBe('09:05')
    expect(toLocalTime(new Date(2026, 8, 16, 0, 0))).toBe('00:00')
    expect(toLocalTime(new Date(2026, 8, 16, 23, 59))).toBe('23:59')
  })
})

describe('atLocalTime', () => {
  it('is that hour on that day, local', () => {
    expect(atLocalTime('2026-09-16', '09:30')).toEqual(new Date(2026, 8, 16, 9, 30))
    expect(atLocalTime('2026-09-16', '00:00')).toEqual(startOfLocalDay('2026-09-16'))
  })

  it('throws on something that is not a day or not an hour', () => {
    expect(() => atLocalTime('2026-02-30', '09:00')).toThrow(InvalidDayError)
    expect(() => atLocalTime('2026-09-16', '24:00')).toThrow(InvalidTimeOfDayError)
  })
})
