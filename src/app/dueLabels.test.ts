import { describe, expect, it } from 'vitest'
import { completeTask, createTask, setDueDate, setRepeat } from '../core'
import {
  PUT_OFF_SHOWN_FROM,
  describeDueAt,
  describeDueDate,
  describeFullDate,
  describeMonth,
  describePutOff,
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

describe('describePutOff (DUE-29)', () => {
  const TUE = new Date(2026, 8, 15, 9, 0)
  const due = setDueDate(createTask('file taxes', null, TUE), '2026-09-15', TUE)
  const once = setDueDate(due, '2026-09-16', TUE)
  const twice = setDueDate(once, '2026-09-17', WED_16)

  it('says nothing of a task put off fewer times than it takes to show', () => {
    expect(PUT_OFF_SHOWN_FROM).toBe(2)
    expect(describePutOff(due, WED_16)).toBeNull()
    expect(describePutOff(once, WED_16)).toBeNull()
  })

  it('marks one put off again, and says in words what the mark means and since when', () => {
    expect(describePutOff(twice, WED_16)).toEqual({
      label: 'Put off 2×',
      detail: 'You moved this task to a later day 2 times when it was due. The first time was Sep 15.',
    })
  })

  it('says nothing once the task is done', () => {
    expect(describePutOff(completeTask(twice, WED_16), WED_16)).toBeNull()
  })

  it('says nothing on a task that has become a repeating one', () => {
    expect(describePutOff(setRepeat(twice, { kind: 'daily' }, WED_16), WED_16)).toBeNull()
  })
})
