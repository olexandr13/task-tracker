import { describe, expect, it } from 'vitest'
import { createActivityEntry, type ActivityEntry, type HourSlot } from './activity'
import {
  daysLoggedInFull,
  DEFAULT_CHECK_IN_WINDOW,
  defaultLogSlot,
  expectedHours,
  hoursOfDay,
  isCheckInWindow,
  isDayLoggedInFull,
  loggedHours,
  otherHoursSoFar,
  pendingCheckIn,
  slotJustEnded,
} from './checkIn'
import type { HoursWindow } from './hours'

/* CHECKIN ids refer to wiki/check-ins.md, ACT ids to wiki/activity-log.md. */

const NINE_TO_TEN: HoursWindow = { from: '09:00', to: '10:00' }

function logged(slot: HourSlot, minutes = 30): ActivityEntry {
  return createActivityEntry('Work', minutes * 60, slot, new Date(2026, 9, 2, 23))
}

/** Every hour of the window logged on the day. */
function fullDay(day: string, window: HoursWindow = NINE_TO_TEN): ActivityEntry[] {
  return expectedHours(window).map((hour) => logged({ day, hour }))
}

describe('the hours kept to (CHECKIN-2)', () => {
  it('are whole hours, a working day to begin with', () => {
    expect(isCheckInWindow(DEFAULT_CHECK_IN_WINDOW)).toBe(true)
    expect(isCheckInWindow({ from: '09:30', to: '22:00' })).toBe(false)
    expect(isCheckInWindow({ from: '9:00', to: '22:00' })).toBe(false)
    expect(isCheckInWindow(null)).toBe(false)
  })

  it('mean the hours whose start lies inside them', () => {
    expect(expectedHours(DEFAULT_CHECK_IN_WINDOW)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])
    expect(expectedHours({ from: '22:00', to: '02:00' })).toEqual([0, 1, 22, 23])
    expect(expectedHours({ from: '08:00', to: '08:00' })).toHaveLength(24)
  })

  it('asks about the hour that ended last', () => {
    expect(slotJustEnded(new Date(2026, 9, 2, 15, 0))).toEqual({ day: '2026-10-02', hour: 14 })
    expect(slotJustEnded(new Date(2026, 9, 2, 0, 30))).toEqual({ day: '2026-10-01', hour: 23 })
  })
})

describe('what is asked (CHECKIN-3)', () => {
  const at15 = new Date(2026, 9, 2, 15, 0)
  const fourteen = { day: '2026-10-02', hour: 14 }

  it('stands for an hour just over, kept to, and not logged', () => {
    expect(pendingCheckIn([], DEFAULT_CHECK_IN_WINDOW, at15, null)).toEqual({ slot: fourteen, others: 5 })
  })

  it('counts the day’s other hours over and not logged', () => {
    const entries = [9, 10, 11].map((hour) => logged({ day: '2026-10-02', hour }))

    expect(pendingCheckIn(entries, DEFAULT_CHECK_IN_WINDOW, at15, null)?.others).toBe(2)
  })

  it('says nothing once the hour is logged, dismissed, or outside the hours kept to', () => {
    expect(pendingCheckIn([logged(fourteen)], DEFAULT_CHECK_IN_WINDOW, at15, null)).toBeNull()
    expect(pendingCheckIn([], DEFAULT_CHECK_IN_WINDOW, at15, '2026-10-02T14')).toBeNull()
    expect(pendingCheckIn([], DEFAULT_CHECK_IN_WINDOW, new Date(2026, 9, 2, 8, 30), null)).toBeNull()
    // 22:00–23:00 is past the hours; the 21:00 hour was the last asked about, at 22:00.
    expect(pendingCheckIn([], DEFAULT_CHECK_IN_WINDOW, new Date(2026, 9, 2, 23, 5), null)).toBeNull()
    expect(pendingCheckIn([], DEFAULT_CHECK_IN_WINDOW, new Date(2026, 9, 2, 22, 5), null)?.slot.hour).toBe(21)
  })
})

describe('how much of a day is logged (ACT-17)', () => {
  it('counts the hours meant to be logged, those over, and those logged', () => {
    const entries = [9, 10, 14].map((hour) => logged({ day: '2026-10-02', hour }))

    expect(loggedHours(entries, DEFAULT_CHECK_IN_WINDOW, '2026-10-02', new Date(2026, 9, 2, 15, 20))).toEqual({
      expected: 13,
      ended: 6,
      logged: 3,
    })
  })

  it('leaves out a record under an hour not kept to', () => {
    const entries = [logged({ day: '2026-10-01', hour: 7 })]

    expect(loggedHours(entries, DEFAULT_CHECK_IN_WINDOW, '2026-10-01', new Date(2026, 9, 2)).logged).toBe(0)
  })
})

describe('days logged in full (ACT-18)', () => {
  const now = new Date(2026, 9, 2, 9, 30)

  it('is every hour kept to, over and logged', () => {
    expect(isDayLoggedInFull(fullDay('2026-10-01'), NINE_TO_TEN, '2026-10-01', now)).toBe(true)
    expect(isDayLoggedInFull([], NINE_TO_TEN, '2026-10-01', now)).toBe(false)
    // Today's hour is not over yet, logged or not.
    expect(isDayLoggedInFull(fullDay('2026-10-02'), NINE_TO_TEN, '2026-10-02', now)).toBe(false)
  })

})

describe('the hours the log lists (ACT-7)', () => {
  it('lists the hours kept to that have begun, and any other hour with something under it', () => {
    const entries = [logged({ day: '2026-10-02', hour: 7 }), logged({ day: '2026-10-01', hour: 23 })]

    expect(hoursOfDay(entries, DEFAULT_CHECK_IN_WINDOW, '2026-10-02', new Date(2026, 9, 2, 11, 30))).toEqual([7, 9, 10, 11])
    expect(hoursOfDay(entries, NINE_TO_TEN, '2026-10-01', new Date(2026, 9, 2, 11, 30))).toEqual([9, 23])
  })

  it('lists, today on asking, every other hour begun so far (ACT-20)', () => {
    const entries = [logged({ day: '2026-10-02', hour: 7 })]

    expect(otherHoursSoFar(entries, DEFAULT_CHECK_IN_WINDOW, '2026-10-02', new Date(2026, 9, 2, 11, 30))).toEqual([0, 1, 2, 3, 4, 5, 6, 8])
    // Before the hours kept to begin, every hour so far, the one under way too.
    expect(otherHoursSoFar([], DEFAULT_CHECK_IN_WINDOW, '2026-10-02', new Date(2026, 9, 2, 2, 5))).toEqual([0, 1, 2])
    // Past the hours kept to, those after them too.
    expect(otherHoursSoFar([], NINE_TO_TEN, '2026-10-02', new Date(2026, 9, 2, 11, 30))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11])
    // A day gone by keeps to its hours kept to.
    expect(otherHoursSoFar([], DEFAULT_CHECK_IN_WINDOW, '2026-10-01', new Date(2026, 9, 2, 11, 30))).toEqual([])
  })
})

describe('the hour a record goes under (ACT-5)', () => {
  const now = new Date(2026, 9, 2, 15, 20)

  it('is, today, the hour just ended while it is not logged, or else the hour under way', () => {
    expect(defaultLogSlot([], DEFAULT_CHECK_IN_WINDOW, '2026-10-02', now)).toEqual({ day: '2026-10-02', hour: 14 })
    expect(defaultLogSlot([logged({ day: '2026-10-02', hour: 14 })], DEFAULT_CHECK_IN_WINDOW, '2026-10-02', now)).toEqual({
      day: '2026-10-02',
      hour: 15,
    })
    // Just past midnight, the hour that ended was yesterday's.
    expect(defaultLogSlot([], DEFAULT_CHECK_IN_WINDOW, '2026-10-02', new Date(2026, 9, 2, 0, 10))).toEqual({
      day: '2026-10-02',
      hour: 0,
    })
  })

  it('is, on a day gone by, its first hour kept to and not logged', () => {
    const entries = [logged({ day: '2026-10-01', hour: 9 })]

    expect(defaultLogSlot(entries, DEFAULT_CHECK_IN_WINDOW, '2026-10-01', now)).toEqual({ day: '2026-10-01', hour: 10 })
    expect(defaultLogSlot(fullDay('2026-10-01'), NINE_TO_TEN, '2026-10-01', now)).toEqual({ day: '2026-10-01', hour: 9 })
  })
})

describe('days logged in full over a period (ACT-18)', () => {
  it('counts the days begun, and those logged in full', () => {
    const week = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
    const entries = [...fullDay('2026-09-29'), ...fullDay('2026-10-01')]

    expect(daysLoggedInFull(entries, NINE_TO_TEN, week, new Date(2026, 9, 2, 9, 30))).toEqual({ inFull: 2, counted: 5 })
  })
})
