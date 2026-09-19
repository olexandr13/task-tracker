import { describe, expect, it } from 'vitest'
import {
  InvalidRepeatError,
  assertValidRepeat,
  currentOccurrence,
  nextOccurrence,
  repeatsEveryDay,
  type Repeat,
} from './repeat'

// Local dates on purpose: occurrences are local days. September 2026 runs
// Mon 14, Tue 15, Wed 16, Thu 17, Fri 18, Sat 19, Sun 20, Mon 21.
const TUE_15_MORNING = new Date(2026, 8, 15, 8, 30)
const TUE_15_NIGHT = new Date(2026, 8, 15, 23, 59)
const MON_14_EVENING = new Date(2026, 8, 14, 19, 0)

const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }

describe('currentOccurrence, daily', () => {
  it('is the start of the day, whatever the time of day', () => {
    const start = new Date(2026, 8, 15)

    expect(currentOccurrence({ kind: 'daily' }, TUE_15_MORNING)).toEqual(start)
    expect(currentOccurrence({ kind: 'daily' }, TUE_15_NIGHT)).toEqual(start)
  })
})

describe('currentOccurrence, weekly', () => {
  it('is today when today is one of the chosen days', () => {
    expect(currentOccurrence(MONDAYS, MON_14_EVENING)).toEqual(new Date(2026, 8, 14))
  })

  it('is the most recent chosen day when today is not one', () => {
    expect(currentOccurrence(MONDAYS, TUE_15_MORNING)).toEqual(new Date(2026, 8, 14))
  })

  it('picks the nearest of several chosen days', () => {
    const monWedFri: Repeat = { kind: 'weekly', weekdays: [1, 3, 5] }

    expect(currentOccurrence(monWedFri, new Date(2026, 8, 16, 9, 0))).toEqual(new Date(2026, 8, 16))
    expect(currentOccurrence(monWedFri, new Date(2026, 8, 17, 9, 0))).toEqual(new Date(2026, 8, 16))
    expect(currentOccurrence(monWedFri, new Date(2026, 8, 20, 9, 0))).toEqual(new Date(2026, 8, 18))
  })

  it('reaches back into the previous week', () => {
    const sundays: Repeat = { kind: 'weekly', weekdays: [0] }

    expect(currentOccurrence(sundays, MON_14_EVENING)).toEqual(new Date(2026, 8, 13))
  })
})

describe('currentOccurrence, monthly', () => {
  it('is this month once the day has arrived', () => {
    expect(currentOccurrence({ kind: 'monthly', day: 15 }, TUE_15_MORNING)).toEqual(new Date(2026, 8, 15))
  })

  it('is last month while this month has not reached the day yet', () => {
    expect(currentOccurrence({ kind: 'monthly', day: 20 }, TUE_15_MORNING)).toEqual(new Date(2026, 7, 20))
  })

  it('rolls back across the turn of the year', () => {
    expect(currentOccurrence({ kind: 'monthly', day: 15 }, new Date(2026, 0, 10, 9, 0))).toEqual(
      new Date(2025, 11, 15),
    )
  })

  it('clamps to the last day of a short month', () => {
    // The 28th is the last day of February 2026, so the 31st lands there.
    expect(currentOccurrence({ kind: 'monthly', day: 31 }, new Date(2026, 1, 28, 9, 0))).toEqual(
      new Date(2026, 1, 28),
    )
  })

  it('falls back to the previous month when the clamped day is still ahead', () => {
    expect(currentOccurrence({ kind: 'monthly', day: 31 }, new Date(2026, 1, 20, 9, 0))).toEqual(
      new Date(2026, 0, 31),
    )
  })
})

describe('assertValidRepeat', () => {
  it('rejects a weekly repeat with no days, which would never come round', () => {
    expect(() => { assertValidRepeat({ kind: 'weekly', weekdays: [] }) }).toThrow(InvalidRepeatError)
  })

  it('rejects a day of the month outside 1-31', () => {
    expect(() => { assertValidRepeat({ kind: 'monthly', day: 0 }) }).toThrow(InvalidRepeatError)
    expect(() => { assertValidRepeat({ kind: 'monthly', day: 32 }) }).toThrow(InvalidRepeatError)
    expect(() => { assertValidRepeat({ kind: 'monthly', day: 1.5 }) }).toThrow(InvalidRepeatError)
  })

  it('accepts the rules that do come round', () => {
    expect(() => { assertValidRepeat({ kind: 'daily' }) }).not.toThrow()
    expect(() => { assertValidRepeat(MONDAYS) }).not.toThrow()
    expect(() => { assertValidRepeat({ kind: 'monthly', day: 31 }) }).not.toThrow()
  })
})

describe('repeatsEveryDay', () => {
  it('holds for a daily rule, and a weekly one on all seven days', () => {
    expect(repeatsEveryDay({ kind: 'daily' })).toBe(true)
    expect(repeatsEveryDay({ kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] })).toBe(true)
  })

  it('does not hold for any rule that skips a day', () => {
    expect(repeatsEveryDay({ kind: 'weekly', weekdays: [1, 2, 3, 4, 5, 6] })).toBe(false)
    expect(repeatsEveryDay({ kind: 'weekly', weekdays: [1, 1, 2, 3, 4, 5, 6] })).toBe(false)
    expect(repeatsEveryDay({ kind: 'monthly', day: 1 })).toBe(false)
  })
})

describe('nextOccurrence', () => {
  it('is the next day the rule falls on, never the day itself', () => {
    const wednesday = new Date(2026, 8, 16, 21, 0)

    expect(nextOccurrence({ kind: 'daily' }, wednesday)).toEqual(new Date(2026, 8, 17))
    expect(nextOccurrence({ kind: 'weekly', weekdays: [1, 3] }, wednesday)).toEqual(new Date(2026, 8, 21))
    expect(nextOccurrence({ kind: 'monthly', day: 16 }, wednesday)).toEqual(new Date(2026, 9, 16))
  })

  it('lands a monthly 31st on the last day of a short month', () => {
    expect(nextOccurrence({ kind: 'monthly', day: 31 }, new Date(2027, 0, 31))).toEqual(new Date(2027, 1, 28))
    expect(nextOccurrence({ kind: 'monthly', day: 31 }, new Date(2027, 1, 28))).toEqual(new Date(2027, 2, 31))
  })
})
