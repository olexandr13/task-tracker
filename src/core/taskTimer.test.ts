import { describe, expect, it } from 'vitest'
import { elapsedSeconds, isGoalExceeded } from './taskTimer'

/* TIME ids refer to wiki/time-goals.md. */

const START = '2026-09-21T10:00:00.000Z'
const AT_90S = new Date('2026-09-21T10:01:30.000Z')
const AT_59S = new Date('2026-09-21T10:00:59.000Z')

describe('elapsedSeconds', () => {
  it('counts whole seconds', () => {
    expect(elapsedSeconds(START, AT_90S)).toBe(90)
    expect(elapsedSeconds(START, AT_59S)).toBe(59)
    expect(elapsedSeconds(START, new Date('2026-09-21T10:00:59.900Z'))).toBe(59)
  })

  it('never goes below zero when now is before the start', () => {
    expect(elapsedSeconds(START, new Date('2026-09-21T09:59:00.000Z'))).toBe(0)
  })

  it('treats an unreadable start as no elapsed time', () => {
    expect(elapsedSeconds('not-a-date', AT_90S)).toBe(0)
  })
})

describe('isGoalExceeded (TIME-19)', () => {
  it('is false with no goal', () => {
    expect(isGoalExceeded({ spentSeconds: 100 * 60, elapsedSeconds: 3600, goal: null })).toBe(false)
  })

  it('is true once logged plus live seconds reach the goal', () => {
    expect(isGoalExceeded({ spentSeconds: 0, elapsedSeconds: 60 * 60 - 1, goal: 60 })).toBe(false)
    expect(isGoalExceeded({ spentSeconds: 0, elapsedSeconds: 60 * 60, goal: 60 })).toBe(true)
    expect(isGoalExceeded({ spentSeconds: 50 * 60, elapsedSeconds: 10 * 60, goal: 60 })).toBe(true)
  })

  it('adds leftover seconds from sessions to the live run', () => {
    expect(isGoalExceeded({ spentSeconds: 40, elapsedSeconds: 19, goal: 1 })).toBe(false)
    expect(isGoalExceeded({ spentSeconds: 40, elapsedSeconds: 20, goal: 1 })).toBe(true)
  })

  it('is true when logged time alone already meets the goal', () => {
    expect(isGoalExceeded({ spentSeconds: 60 * 60, elapsedSeconds: 0, goal: 60 })).toBe(true)
    expect(isGoalExceeded({ spentSeconds: 90 * 60, elapsedSeconds: 5, goal: 60 })).toBe(true)
  })
})
