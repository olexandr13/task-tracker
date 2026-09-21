import { describe, expect, it } from 'vitest'
import { elapsedMinutesFloor, elapsedSeconds, isGoalExceeded } from './taskTimer'

/* TIME ids refer to wiki/time-goals.md. */

const START = '2026-09-21T10:00:00.000Z'
const AT_90S = new Date('2026-09-21T10:01:30.000Z')
const AT_59S = new Date('2026-09-21T10:00:59.000Z')
const AT_3600S = new Date('2026-09-21T11:00:00.000Z')

describe('elapsedSeconds / elapsedMinutesFloor', () => {
  it('counts whole seconds and floors to minutes', () => {
    expect(elapsedSeconds(START, AT_90S)).toBe(90)
    expect(elapsedMinutesFloor(START, AT_90S)).toBe(1)
    expect(elapsedSeconds(START, AT_59S)).toBe(59)
    expect(elapsedMinutesFloor(START, AT_59S)).toBe(0)
    expect(elapsedMinutesFloor(START, AT_3600S)).toBe(60)
  })

  it('never goes below zero when now is before the start', () => {
    expect(elapsedSeconds(START, new Date('2026-09-21T09:59:00.000Z'))).toBe(0)
    expect(elapsedMinutesFloor(START, new Date('2026-09-21T09:59:00.000Z'))).toBe(0)
  })

  it('treats an unreadable start as no elapsed time', () => {
    expect(elapsedSeconds('not-a-date', AT_90S)).toBe(0)
    expect(elapsedMinutesFloor('not-a-date', AT_90S)).toBe(0)
  })
})

describe('isGoalExceeded', () => {
  it('is false with no goal', () => {
    expect(isGoalExceeded({ spent: 100, elapsedSeconds: 3600, goal: null })).toBe(false)
  })

  it('is true once spent plus live floor minutes reach the goal', () => {
    expect(isGoalExceeded({ spent: 0, elapsedSeconds: 59 * 60, goal: 60 })).toBe(false)
    expect(isGoalExceeded({ spent: 0, elapsedSeconds: 60 * 60, goal: 60 })).toBe(true)
    expect(isGoalExceeded({ spent: 50, elapsedSeconds: 10 * 60, goal: 60 })).toBe(true)
  })

  it('is true when logged time alone already meets the goal', () => {
    expect(isGoalExceeded({ spent: 60, elapsedSeconds: 0, goal: 60 })).toBe(true)
    expect(isGoalExceeded({ spent: 90, elapsedSeconds: 5, goal: 60 })).toBe(true)
  })
})
