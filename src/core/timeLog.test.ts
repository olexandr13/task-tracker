import { describe, expect, it } from 'vitest'
import { completeTask, createTask, duplicateTask, isComplete, setRepeat, uncompleteTask, type Task } from './task'
import {
  hasTimeGoal,
  InvalidTimeError,
  isTimeGoalReached,
  logSeconds,
  logTime,
  MAX_SESSION_MINUTES,
  MAX_SESSION_SECONDS,
  MAX_TIME_GOAL_MINUTES,
  removeTimeEntry,
  secondsSpent,
  setTimeGoal,
  timeSpent,
} from './timeLog'

/* TIME ids refer to wiki/time-goals.md. */

const MON_14 = new Date(2026, 8, 14, 9, 0)
const TUE_15 = new Date(2026, 8, 15, 8, 0)
const TUE_15_EVENING = new Date(2026, 8, 15, 19, 30)
const WED_16 = new Date(2026, 8, 16, 7, 0)
const MON_21 = new Date(2026, 8, 21, 9, 0)

/** "1 hour of sport", as a daily habit. */
function sport(repeat: Task['repeat'] = { kind: 'daily' }): Task {
  return setTimeGoal(createTask('sport', repeat, MON_14), 60)
}

describe('setTimeGoal (TIME-1)', () => {
  it('gives a task a goal, changes it, and takes it away', () => {
    const task = createTask('sport', null, MON_14)
    expect(hasTimeGoal(task)).toBe(false)

    const given = setTimeGoal(task, 60)
    expect(given.timeGoal).toBe(60)
    expect(hasTimeGoal(given)).toBe(true)
    expect(setTimeGoal(given, 90).timeGoal).toBe(90)
    expect(setTimeGoal(given, null).timeGoal).toBeNull()
    expect(task.timeGoal).toBeNull()
  })

  it('takes whole minutes up to a hundred hours only', () => {
    const task = createTask('sport', null, MON_14)

    for (const minutes of [0, -5, 1.5, MAX_TIME_GOAL_MINUTES + 1, Number.NaN]) {
      expect(() => setTimeGoal(task, minutes)).toThrow(InvalidTimeError)
    }
    expect(setTimeGoal(task, MAX_TIME_GOAL_MINUTES).timeGoal).toBe(MAX_TIME_GOAL_MINUTES)
  })

  it('hands back the task itself when nothing changes', () => {
    const task = sport()

    expect(setTimeGoal(task, 60)).toBe(task)
  })

  it('leaves the time logged as it was (TIME-2)', () => {
    const task = logTime(sport(), 40, TUE_15)

    expect(timeSpent(setTimeGoal(task, 30), TUE_15)).toBe(40)
    expect(timeSpent(setTimeGoal(task, null), TUE_15)).toBe(40)
  })
})

describe('logTime (TIME-3)', () => {
  it('adds up the sessions logged', () => {
    const task = logTime(logTime(sport(), 20, TUE_15), 25, TUE_15_EVENING)

    expect(timeSpent(task, TUE_15_EVENING)).toBe(45)
    expect(task.timeLog.map((entry) => entry.seconds)).toEqual([20 * 60, 25 * 60])
  })

  it('takes whole minutes from 1 up to a day only', () => {
    const task = sport()

    for (const minutes of [0, -1, 2.5, MAX_SESSION_MINUTES + 1]) {
      expect(() => logTime(task, minutes, TUE_15)).toThrow(InvalidTimeError)
    }
    expect(timeSpent(logTime(task, MAX_SESSION_MINUTES, TUE_15), TUE_15)).toBe(MAX_SESSION_MINUTES)
  })

  it('is logged on a task without a goal too', () => {
    const task = logTime(createTask('read', null, MON_14), 15, TUE_15)

    expect(timeSpent(task, TUE_15)).toBe(15)
    expect(isTimeGoalReached(task, TUE_15)).toBe(false)
  })

  it('never finishes or reopens the task (TIME-6)', () => {
    const reached = logTime(sport(), 60, TUE_15)
    expect(isComplete(reached, TUE_15)).toBe(false)

    const done = completeTask(sport(), TUE_15)
    expect(isComplete(logTime(done, 10, TUE_15), TUE_15)).toBe(true)
  })
})

describe('isTimeGoalReached (TIME-5)', () => {
  it('is reached once the time logged is at least the goal', () => {
    const started = logTime(sport(), 40, TUE_15)
    expect(isTimeGoalReached(started, TUE_15)).toBe(false)

    expect(isTimeGoalReached(logTime(started, 20, TUE_15_EVENING), TUE_15_EVENING)).toBe(true)
    expect(isTimeGoalReached(logTime(started, 45, TUE_15_EVENING), TUE_15_EVENING)).toBe(true)
  })

  it('is never reached without a goal', () => {
    const task = logTime(createTask('sport', null, MON_14), 600, TUE_15)

    expect(isTimeGoalReached(task, TUE_15)).toBe(false)
  })
})

describe('time under a repeating task (TIME-7)', () => {
  it('starts a daily task from nothing again the next day', () => {
    const task = logTime(sport(), 60, TUE_15)

    expect(timeSpent(task, WED_16)).toBe(0)
    expect(isTimeGoalReached(task, WED_16)).toBe(false)
  })

  it('counts a weekly task until its next chosen day comes round', () => {
    const task = logTime(sport({ kind: 'weekly', weekdays: [1] }), 30, MON_14)

    expect(timeSpent(logTime(task, 30, WED_16), WED_16)).toBe(60)
    expect(timeSpent(task, MON_21)).toBe(0)
  })

  it('keeps every session of a task that happens once, whatever the day', () => {
    const task = logTime(logTime(sport(null), 30, MON_14), 30, WED_16)

    expect(timeSpent(task, MON_21)).toBe(60)
  })

  it('lets go of sessions from occurrences gone by as the next is logged (TIME-8)', () => {
    const task = logTime(logTime(sport(), 50, MON_14), 10, TUE_15)

    expect(task.timeLog.map((entry) => entry.seconds)).toEqual([10 * 60])
  })

  it('lets go of sessions that no longer count when the rule is dropped, keeping those that do', () => {
    // Yesterday's session is still on the task: nothing has been logged since to let go of it.
    const task = logTime(sport(), 10, TUE_15)
    const stale = { ...task, timeLog: [{ id: 'old', seconds: 50 * 60, loggedAt: MON_14.toISOString() }, ...task.timeLog] }

    const oneOff = setRepeat(stale, null, TUE_15_EVENING)

    expect(oneOff.timeLog.map((entry) => entry.seconds)).toEqual([10 * 60])
    expect(timeSpent(oneOff, MON_21)).toBe(10)
  })

  it('is left alone by ticking the task off and back (TIME-6)', () => {
    const task = logTime(sport(), 30, TUE_15)

    expect(timeSpent(uncompleteTask(completeTask(task, TUE_15), TUE_15), TUE_15)).toBe(30)
  })
})

describe('logSeconds (TIME-22)', () => {
  it('adds seconds up across sessions before reading whole minutes', () => {
    const once = logSeconds(sport(), 20, TUE_15)
    const twice = logSeconds(once, 20, TUE_15)
    const thrice = logSeconds(twice, 20, TUE_15)

    expect([timeSpent(once, TUE_15), timeSpent(twice, TUE_15), timeSpent(thrice, TUE_15)]).toEqual([0, 0, 1])
    expect(secondsSpent(thrice, TUE_15)).toBe(60)
  })

  it('adds seconds to minutes logged by hand', () => {
    const task = logSeconds(logTime(sport(), 59, TUE_15), 59, TUE_15)

    expect(timeSpent(task, TUE_15)).toBe(59)
    expect(isTimeGoalReached(task, TUE_15)).toBe(false)
    expect(isTimeGoalReached(logSeconds(task, 1, TUE_15), TUE_15)).toBe(true)
  })

  it('takes whole seconds from one to a day only', () => {
    const task = sport()

    for (const seconds of [0, -1, 2.5, MAX_SESSION_SECONDS + 1, Number.NaN]) {
      expect(() => logSeconds(task, seconds, TUE_15)).toThrow(InvalidTimeError)
    }
    expect(secondsSpent(logSeconds(task, MAX_SESSION_SECONDS, TUE_15), TUE_15)).toBe(MAX_SESSION_SECONDS)
  })

  it('counts seconds for the occurrence they were logged in (TIME-7)', () => {
    const task = logSeconds(logSeconds(sport(), 40, MON_14), 40, TUE_15)

    expect(secondsSpent(task, TUE_15)).toBe(40)
    expect(timeSpent(task, TUE_15)).toBe(0)
  })
})

describe('removeTimeEntry (TIME-4)', () => {
  it('takes one session back and leaves the rest', () => {
    const task = logTime(logTime(sport(), 20, TUE_15), 25, TUE_15_EVENING)
    const [first] = task.timeLog

    const kept = removeTimeEntry(task, first?.id ?? '')

    expect(timeSpent(kept, TUE_15_EVENING)).toBe(25)
  })

  it('hands back the task itself when there is no such session', () => {
    const task = logTime(sport(), 20, TUE_15)

    expect(removeTimeEntry(task, 'nothing')).toBe(task)
  })
})

describe('duplicateTask (TIME-9)', () => {
  it('carries the goal and none of the time logged', () => {
    const copy = duplicateTask(logTime(sport(), 30, TUE_15), TUE_15)

    expect(copy.timeGoal).toBe(60)
    expect(copy.timeLog).toEqual([])
  })
})
