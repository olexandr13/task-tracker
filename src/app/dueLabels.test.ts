import { describe, expect, it } from 'vitest'
import { describeDueDate, describeShortDate } from './dueLabels'

const WED_16 = new Date(2026, 8, 16, 9, 0)

describe('describeDueDate', () => {
  it('reads the days either side of today relatively', () => {
    expect(describeDueDate('2026-09-16', WED_16)).toBe('Today')
    expect(describeDueDate('2026-09-17', WED_16)).toBe('Tomorrow')
    expect(describeDueDate('2026-09-15', WED_16)).toBe('Yesterday')
  })

  it('gives a short date otherwise, with the year only when it is not this one', () => {
    expect(describeDueDate('2026-09-20', WED_16)).toBe('Sep 20')
    expect(describeDueDate('2026-01-02', WED_16)).toBe('Jan 2')
    expect(describeDueDate('2027-01-02', WED_16)).toBe('Jan 2, 2027')
  })
})

describe('describeShortDate', () => {
  it('is a short date even for today and tomorrow', () => {
    expect(describeShortDate('2026-09-16', WED_16)).toBe('Sep 16')
    expect(describeShortDate('2027-01-02', WED_16)).toBe('Jan 2, 2027')
  })
})
