import { describe, expect, it } from 'vitest'
import {
  describeDueAt,
  describeDueDate,
  describeFullDate,
  describeMonth,
  describeShortDate,
  describeTimeOfDay,
} from './dueLabels'

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

describe('describeMonth', () => {
  it('names the month and its year, as a calendar is headed', () => {
    expect(describeMonth('2026-09-01')).toBe('September 2026')
  })
})

describe('describeFullDate', () => {
  it('spells the day out in full, weekday and year included', () => {
    expect(describeFullDate('2026-10-01')).toBe('Thursday, October 1, 2026')
  })
})

describe('describeShortDate', () => {
  it('is a short date even for today and tomorrow', () => {
    expect(describeShortDate('2026-09-16', WED_16)).toBe('Sep 16')
    expect(describeShortDate('2027-01-02', WED_16)).toBe('Jan 2, 2027')
  })
})

describe('describeTimeOfDay', () => {
  it('reads the hour off a twenty-four hour clock, the whole day told apart', () => {
    expect(describeTimeOfDay('09:00')).toBe('09:00')
    expect(describeTimeOfDay('18:30')).toBe('18:30')
    expect(describeTimeOfDay('00:00')).toBe('00:00')
  })
})

describe('describeDueAt', () => {
  it('reads the hour with the day it falls on', () => {
    expect(describeDueAt('2026-09-16', '09:00', WED_16)).toBe('Today at 09:00')
    expect(describeDueAt('2026-09-20', '18:30', WED_16)).toBe('Sep 20 at 18:30')
  })

  it('is the day alone where the task is due at no hour', () => {
    expect(describeDueAt('2026-09-16', null, WED_16)).toBe('Today')
  })
})
