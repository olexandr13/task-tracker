import { describe, expect, it } from 'vitest'
import { completeTask, createTask, duplicateTask, isComplete, setRepeat, uncompleteTask, type Task } from './task'
import {
  hasTimeGoal,
  InvalidTimeError,
  isTimeComment,
  isTimeGoalReached,
  keptEntries,
  logSeconds,
  logTime,
  MAX_SESSION_MINUTES,
  MAX_SESSION_SECONDS,
  MAX_TIME_COMMENT_LENGTH,
  MAX_TIME_GOAL_MINUTES,
  removeTimeEntry,
  secondsSpent,
  sessionsLogged,
  setTimeGoal,
  TIME_HISTORY_DAYS,
  timeHistoryStart,
  timeSpent,
  type TimeEntry,
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

describe('a comment on a session (TIME-23)', () => {
  it('is kept with the session it was given for, trimmed, and only that one', () => {
    const task = logTime(logTime(sport(), 20, TUE_15, '  intervals  '), 10, TUE_15_EVENING)

    expect(task.timeLog.map((entry) => entry.comment)).toEqual(['intervals', null])
  })

  it('goes with a timer’s run too (TIME-22)', () => {
    expect(logSeconds(sport(), 90, TUE_15, 'warm-up').timeLog[0]?.comment).toBe('warm-up')
  })

  it('is none when nothing but spaces is given', () => {
    expect(logTime(sport(), 20, TUE_15, '   ').timeLog[0]?.comment).toBeNull()
  })

  it('is one line of at most the longest a comment can be', () => {
    expect(isTimeComment('a'.repeat(MAX_TIME_COMMENT_LENGTH))).toBe(true)
    expect(isTimeComment('a'.repeat(MAX_TIME_COMMENT_LENGTH + 1))).toBe(false)
    expect(isTimeComment('two\nlines')).toBe(false)
    expect(isTimeComment('  ')).toBe(false)

    expect(() => logTime(sport(), 20, TUE_15, 'a'.repeat(MAX_TIME_COMMENT_LENGTH + 1))).toThrow(InvalidTimeError)
    expect(() => logTime(sport(), 20, TUE_15, 'two\nlines')).toThrow(InvalidTimeError)
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

  it('keeps sessions from occurrences gone by as history, counting only the occurrence in play (TIME-8)', () => {
    const task = logTime(logTime(sport(), 50, MON_14), 10, TUE_15)

    expect(task.timeLog.map((entry) => entry.seconds)).toEqual([50 * 60, 10 * 60])
    expect(timeSpent(task, TUE_15)).toBe(10)
  })

  it('lets go of sessions older than the history as the next is logged (TIME-8)', () => {
    const old = logTime(sport(), 50, new Date(2026, 7, 10, 9, 0))
    const recent = logTime(old, 20, new Date(2026, 8, 1, 9, 0))

    const task = logTime(recent, 10, TUE_15)

    // 10 August is more than thirty days and a month before 15 September; 1 September is neither.
    expect(task.timeLog.map((entry) => entry.seconds)).toEqual([20 * 60, 10 * 60])
  })

  it('lets go of sessions that no longer count when the rule is dropped, history too, keeping those that do', () => {
    // Yesterday's session is still on the task: nothing has been logged since to let go of it.
    const task = logTime(sport(), 10, TUE_15)
    const stale = { ...task, timeLog: [{ id: 'old', seconds: 50 * 60, loggedAt: MON_14.toISOString(), comment: null }, ...task.timeLog] }

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

describe('the history of time (TIME-8, BAL-3)', () => {
  const at = (moment: Date): TimeEntry => ({ id: moment.toISOString(), seconds: 60, loggedAt: moment.toISOString(), comment: null })

  it('reaches thirty days back, today among them', () => {
    expect(TIME_HISTORY_DAYS).toBe(30)
    // 30 September: the 1st of the month is 29 days back, so thirty days reach it exactly.
    expect(timeHistoryStart(new Date(2026, 8, 30, 12, 0))).toEqual(new Date(2026, 8, 1))
    // 31 October: thirty days back is 2 October, later than the 1st.
    expect(timeHistoryStart(new Date(2026, 9, 31, 12, 0))).toEqual(new Date(2026, 9, 1))
  })

  it('never reaches less far back than the start of the month', () => {
    expect(timeHistoryStart(new Date(2026, 9, 31, 23, 59))).toEqual(new Date(2026, 9, 1))
    // Early in a month, thirty days reach into the one before.
    expect(timeHistoryStart(new Date(2026, 9, 5, 8, 0))).toEqual(new Date(2026, 8, 6))
  })

  it('keeps what counts and what is recent under a repeating task, and everything under a one-off', () => {
    const now = new Date(2026, 9, 5, 8, 0)
    const old = at(new Date(2026, 8, 5, 20, 0))
    const recent = at(new Date(2026, 8, 6, 0, 0))
    const today = at(new Date(2026, 9, 5, 7, 0))

    expect(keptEntries([old, recent, today], { kind: 'daily' }, now)).toEqual([recent, today])
    expect(keptEntries([old, recent, today], null, now)).toEqual([old, recent, today])
  })

  it('keeps a session that still counts, however long ago it was logged', () => {
    // A monthly task on the 31st fell on 30 September, which has no 31st, and is
    // in play until 31 October: a session from the 30th still counts on the 30th
    // of October, before the history's start of 1 October.
    const now = new Date(2026, 9, 30, 8, 0)
    const counting = at(new Date(2026, 8, 30, 9, 0))

    expect(timeHistoryStart(now)).toEqual(new Date(2026, 9, 1))
    expect(keptEntries([counting], { kind: 'monthly', day: 31 }, now)).toEqual([counting])
  })
})

describe('the sessions a change logs (ACT-21)', () => {
  it('are the ones a task has after it and did not before, however logged', () => {
    const read = logTime(createTask('read', null, MON_14), 15, MON_14)
    const sport = createTask('sport', null, MON_14)
    const before = [read, sport]
    const after = [logSeconds(read, 40, TUE_15), logTime(sport, 30, TUE_15, 'run')]

    expect(sessionsLogged(before, after)).toEqual([
      { task: after[0], entry: after[0].timeLog[1] },
      { task: after[1], entry: after[1].timeLog[0] },
    ])
  })

  it('include those a new task is added with, and never one taken back', () => {
    const added = logTime(createTask('read', null, MON_14), 15, MON_14)
    const twice = logTime(added, 5, TUE_15)

    expect(sessionsLogged([], [added])).toEqual([{ task: added, entry: added.timeLog[0] }])
    expect(sessionsLogged([twice], [removeTimeEntry(twice, twice.timeLog[1].id)])).toEqual([])
    expect(sessionsLogged([twice], [{ ...twice, title: 'books' }])).toEqual([])
  })
})
