import { describe, expect, it } from 'vitest'
import { createActivityEntry, secondsEntry, sessionActivityEntries } from '../core'
import {
  describeDaysInFull,
  describeEntry,
  describeEntryDeleted,
  describeEntryFully,
  describeEntryTimes,
  describeLoggedHours,
  describeNothingLogged,
  describePeriodInSentence,
  describePeriodTitle,
} from './activityLabels'
import { describeCheckInQuestion, describeCheckInSilence, describeOthersNotLogged, describeSlot } from './checkInLabels'

/* How the activity log and the check-in read. ACT ids refer to wiki/activity-log.md, CHECKIN ids to wiki/check-ins.md. */

const NOW = new Date(2026, 9, 2, 15, 20)

describe('the period shown (ACT-12)', () => {
  it('names a day, a week and a month the way they are said', () => {
    expect(describePeriodTitle('day', '2026-10-02', NOW)).toBe('Today')
    expect(describePeriodTitle('day', '2026-10-01', NOW)).toBe('Yesterday')
    expect(describePeriodTitle('day', '2026-09-29', NOW)).toBe('Tue, Sep 29')
    expect(describePeriodTitle('week', '2026-10-02', NOW)).toBe('This week')
    expect(describePeriodTitle('week', '2026-09-23', NOW)).toBe('Last week')
    expect(describePeriodTitle('week', '2026-09-16', NOW)).toBe('Sep 14 – 20')
    expect(describePeriodTitle('week', '2026-08-31', NOW)).toBe('Aug 31 – Sep 6')
    expect(describePeriodTitle('month', '2026-10-15', NOW)).toBe('This month')
    expect(describePeriodTitle('month', '2026-09-01', NOW)).toBe('September 2026')
  })

  it('puts it in a sentence', () => {
    expect(describePeriodInSentence('day', '2026-09-29', NOW)).toBe('on Tue, Sep 29')
    expect(describePeriodInSentence('week', '2026-09-16', NOW)).toBe('in the week of Sep 14 – 20')
    expect(describeNothingLogged('day', '2026-10-01', NOW)).toBe('Nothing logged yesterday.')
  })
})

describe('how much is logged (ACT-17, ACT-18)', () => {
  it('counts the hours over, and those logged', () => {
    expect(describeLoggedHours({ expected: 13, ended: 6, logged: 4 })).toBe('4 of 6 hours logged so far')
    expect(describeLoggedHours({ expected: 13, ended: 13, logged: 13 })).toBe('13 of 13 hours logged')
    expect(describeLoggedHours({ expected: 13, ended: 0, logged: 0 })).toBe('13 hours to log today')
    expect(describeDaysInFull({ inFull: 1, counted: 1 })).toBe('1 of 1 day logged in full')
  })

})

describe('a record (ACT-7, ACT-11)', () => {
  it('reads as what and how long, and says where it was deleted from', () => {
    const entry = createActivityEntry('Work', 4800, { day: '2026-10-02', hour: 9 }, NOW)

    expect(describeEntry(entry)).toBe('Work 1h 20m')
    expect(describeEntryDeleted(entry)).toBe('Deleted “Work 1h 20m” at 09:00')
  })

  it('says when it was spent, when it knows (ACT-21)', () => {
    const typed = createActivityEntry('Work', 1800, { day: '2026-10-02', hour: 11 }, NOW)
    const timed = (seconds: number, at: Date) => sessionActivityEntries('Work', 'task-1', secondsEntry(seconds, at))
    const [run] = timed(1790, new Date(2026, 9, 2, 11, 33, 10))
    const [, minute] = timed(80, new Date(2026, 9, 2, 12, 0, 20))

    expect(describeEntryTimes(typed)).toBeNull()
    expect(describeEntryFully(typed)).toBe('“Work 30m”')
    expect(describeEntryTimes(run)).toBe('11:03–11:33')
    expect(describeEntryFully(run)).toBe('“Work 29m”, 11:03–11:33')
    expect(describeEntryTimes(minute)).toBe('12:00')
  })
})

describe('the check-in (CHECKIN-2, CHECKIN-4)', () => {
  it('asks about the hour as the stretch it is, midnight included', () => {
    expect(describeSlot({ day: '2026-10-02', hour: 23 })).toBe('23:00–00:00')
    expect(describeCheckInQuestion({ day: '2026-10-02', hour: 14 })).toBe('What did you do 14:00–15:00?')
    expect(describeOthersNotLogged(0)).toBeNull()
    expect(describeOthersNotLogged(1)).toBe('1 more hour not logged today')
  })

  it('says the stretch it asks nothing about, or that it asks every hour', () => {
    expect(describeCheckInSilence({ from: '09:00', to: '22:00' })).toBe('It asks nothing about the hours between 22:00 and 09:00.')
    expect(describeCheckInSilence({ from: '08:00', to: '08:00' })).toContain('every hour')
  })
})
