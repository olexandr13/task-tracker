import { describe, expect, it } from 'vitest'
import { createTask, setRepeat, deleteTask, type Task } from './task'
import {
  canTakeOnHabit,
  habitAllowance,
  isWarmingUp,
  pauseWarmUp,
  resumeWarmUp,
  startWarmUp,
  WARM_UP_DAYS,
  warmUpDay,
  warmUpProgress,
} from './warmUp'

const START = new Date(2026, 8, 1, 9, 0)

function habit(title: string): Task {
  return setRepeat(createTask(title), { kind: 'daily' })
}

function dayOfWarmUp(day: number, hour = 9): Date {
  return new Date(2026, 8, day, hour, 0)
}

describe('starting a warm-up', () => {
  it('begins on the day it is started', () => {
    expect(startWarmUp(START)).toEqual({ startedOn: '2026-09-01', pausedOn: null, pausedDays: 0 })
  })

  it('counts the day it began as its first', () => {
    expect(warmUpDay(startWarmUp(START), START)).toBe(1)
  })
})

describe('which day a warm-up is on', () => {
  const warmUp = startWarmUp(START)

  it('is one more with every day gone by', () => {
    expect(warmUpDay(warmUp, dayOfWarmUp(2))).toBe(2)
    expect(warmUpDay(warmUp, dayOfWarmUp(3))).toBe(3)
  })

  it('reads by the local day, not by the hours between', () => {
    // Started at 09:00, asked just after midnight: a new day, however few hours.
    expect(warmUpDay(warmUp, dayOfWarmUp(2, 0))).toBe(2)
    // And still the first day late on that first evening.
    expect(warmUpDay(warmUp, dayOfWarmUp(1, 23))).toBe(1)
  })

  it('runs out after a month', () => {
    expect(warmUpDay(warmUp, dayOfWarmUp(WARM_UP_DAYS))).toBe(WARM_UP_DAYS)
    expect(warmUpDay(warmUp, dayOfWarmUp(WARM_UP_DAYS + 1))).toBeNull()
    expect(isWarmingUp(warmUp, dayOfWarmUp(WARM_UP_DAYS + 1))).toBe(false)
  })

  it('reads a day before it began as its first, rather than a day zero', () => {
    expect(warmUpDay(warmUp, new Date(2026, 7, 30, 9, 0))).toBe(1)
  })

  it('is nothing at all without a warm-up', () => {
    expect(warmUpDay(null, START)).toBeNull()
    expect(isWarmingUp(null, START)).toBe(false)
  })
})

describe('what a day allows', () => {
  it('allows one habit on the first day and one more on each after it', () => {
    expect(habitAllowance(1)).toBe(1)
    expect(habitAllowance(2)).toBe(2)
    expect(habitAllowance(WARM_UP_DAYS)).toBe(WARM_UP_DAYS)
  })
})

describe('where a warm-up stands', () => {
  const warmUp = startWarmUp(START)

  it('is nothing to report without one, or once it is over', () => {
    expect(warmUpProgress(null, [], START)).toBeNull()
    expect(warmUpProgress(warmUp, [], dayOfWarmUp(WARM_UP_DAYS + 1))).toBeNull()
  })

  it('allows the first habit on the first day, and no second', () => {
    expect(warmUpProgress(warmUp, [], START)).toEqual({
      day: 1,
      daysLeft: WARM_UP_DAYS - 1,
      allowed: 1,
      used: 0,
      remaining: 1,
      paused: false,
    })

    const one = [habit('stretch')]
    expect(warmUpProgress(warmUp, one, START)?.remaining).toBe(0)
    expect(canTakeOnHabit(warmUp, one, START)).toBe(false)
  })

  it('allows one more the next day', () => {
    const one = [habit('stretch')]
    expect(warmUpProgress(warmUp, one, dayOfWarmUp(2))).toEqual({
      day: 2,
      daysLeft: WARM_UP_DAYS - 2,
      allowed: 2,
      used: 1,
      remaining: 1,
      paused: false,
    })
    expect(canTakeOnHabit(warmUp, one, dayOfWarmUp(2))).toBe(true)
  })

  it('counts every habit there is, not only those taken on since it began', () => {
    const many = [habit('stretch'), habit('read'), habit('walk')]
    expect(warmUpProgress(warmUp, many, dayOfWarmUp(2))).toMatchObject({ allowed: 2, used: 3, remaining: 0 })
    expect(canTakeOnHabit(warmUp, many, dayOfWarmUp(2))).toBe(false)
    // The days catch up; nothing is taken away meanwhile.
    expect(canTakeOnHabit(warmUp, many, dayOfWarmUp(4))).toBe(true)
  })

  it('counts a weekly rule on all seven days, which reads as daily', () => {
    const everyDay = setRepeat(createTask('stretch'), { kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] })
    expect(warmUpProgress(warmUp, [everyDay], START)?.used).toBe(1)
  })

  it('does not count tasks that are not habits', () => {
    const weekly = setRepeat(createTask('shop'), { kind: 'weekly', weekdays: [1] })
    const once = createTask('call the dentist')
    expect(warmUpProgress(warmUp, [weekly, once], START)?.used).toBe(0)
    expect(canTakeOnHabit(warmUp, [weekly, once], START)).toBe(true)
  })

  it('frees a place when a habit is deleted', () => {
    const dropped = deleteTask(habit('stretch'), START)
    expect(warmUpProgress(warmUp, [dropped], START)?.used).toBe(0)
    expect(canTakeOnHabit(warmUp, [dropped], START)).toBe(true)
  })

  it('holds nothing back once there is no warm-up', () => {
    const many = [habit('stretch'), habit('read'), habit('walk')]
    expect(canTakeOnHabit(null, many, START)).toBe(true)
    expect(canTakeOnHabit(startWarmUp(START), many, dayOfWarmUp(WARM_UP_DAYS + 1))).toBe(true)
  })
})

describe('pausing a warm-up', () => {
  const warmUp = startWarmUp(START)
  const habits = [habit('stretch'), habit('read'), habit('walk')]

  it('freezes the day it is paused on, habits and all (WARM-11)', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(2))

    expect(paused).toEqual({ startedOn: '2026-09-01', pausedOn: '2026-09-02', pausedDays: 0 })
    expect(warmUpProgress(paused, habits, dayOfWarmUp(2))).toMatchObject({
      day: 2,
      allowed: 2,
      used: 3,
      remaining: 0,
      paused: true,
    })
    // Ten days later the allowance is the one it froze on, and nothing was taken away.
    expect(warmUpProgress(paused, habits, dayOfWarmUp(12))).toMatchObject({
      day: 2,
      allowed: 2,
      used: 3,
      remaining: 0,
      paused: true,
    })
    expect(canTakeOnHabit(paused, habits, dayOfWarmUp(12))).toBe(false)
    expect(isWarmingUp(paused, dayOfWarmUp(WARM_UP_DAYS + 10))).toBe(true)
  })

  it('still has room for a habit the frozen day allows', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(3))

    expect(canTakeOnHabit(paused, [habit('stretch')], dayOfWarmUp(10))).toBe(true)
    expect(warmUpProgress(paused, [habit('stretch')], dayOfWarmUp(10))?.allowed).toBe(3)
  })

  it('leaves a pause where it is when asked to pause again', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(3))

    expect(pauseWarmUp(paused, dayOfWarmUp(9))).toBe(paused)
  })

  it('leaves a finished warm-up finished', () => {
    expect(pauseWarmUp(warmUp, dayOfWarmUp(WARM_UP_DAYS + 1))).toBe(warmUp)
  })

  it('pauses a clock sitting before the start on the day it began', () => {
    const paused = pauseWarmUp(warmUp, new Date(2026, 7, 30, 9, 0))

    expect(paused.pausedOn).toBe('2026-09-01')
    expect(warmUpDay(paused, new Date(2026, 7, 30, 9, 0))).toBe(1)
  })

  it('resumes the same day on the day it froze', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(3))
    const resumed = resumeWarmUp(paused, dayOfWarmUp(3, 18))

    expect(resumed).toEqual({ startedOn: '2026-09-01', pausedOn: null, pausedDays: 0 })
    expect(warmUpDay(resumed, dayOfWarmUp(3, 18))).toBe(3)
  })

  it('allows one more on a later day, and keeps the day it began (WARM-11)', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(2))
    const resumed = resumeWarmUp(paused, dayOfWarmUp(12))

    expect(resumed).toEqual({ startedOn: '2026-09-01', pausedOn: null, pausedDays: 9 })
    expect(warmUpProgress(resumed, habits, dayOfWarmUp(12))).toMatchObject({
      day: 3,
      allowed: 3,
      used: 3,
      remaining: 0,
      paused: false,
    })
    // The day after is one more again. The days away were not each a habit.
    expect(warmUpDay(resumed, dayOfWarmUp(13))).toBe(4)
    expect(canTakeOnHabit(resumed, habits, dayOfWarmUp(13))).toBe(true)
  })

  it('adds a second pause onto the days already skipped', () => {
    const once = resumeWarmUp(pauseWarmUp(warmUp, dayOfWarmUp(2)), dayOfWarmUp(12))
    const twice = pauseWarmUp(once, dayOfWarmUp(14))

    expect(warmUpDay(twice, dayOfWarmUp(20))).toBe(5)
    const resumed = resumeWarmUp(twice, dayOfWarmUp(20))
    expect(resumed.pausedDays).toBe(once.pausedDays + 5)
    expect(warmUpDay(resumed, dayOfWarmUp(20))).toBe(6)
    expect(resumed.startedOn).toBe(warmUp.startedOn)
  })

  it('does not resume into a day that has not reached the pause', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(5))

    expect(resumeWarmUp(paused, dayOfWarmUp(4))).toBe(paused)
  })

  it('ends once the last day was paused and a new day resumes it (WARM-10)', () => {
    const paused = pauseWarmUp(warmUp, dayOfWarmUp(WARM_UP_DAYS))

    expect(warmUpDay(paused, dayOfWarmUp(WARM_UP_DAYS + 10))).toBe(WARM_UP_DAYS)
    const resumed = resumeWarmUp(paused, dayOfWarmUp(WARM_UP_DAYS + 5))
    expect(resumed.startedOn).toBe(warmUp.startedOn)
    expect(resumed.pausedOn).toBeNull()
    expect(warmUpDay(resumed, dayOfWarmUp(WARM_UP_DAYS + 5))).toBeNull()
  })

  it('leaves a warm-up that is running when asked to resume', () => {
    expect(resumeWarmUp(warmUp, dayOfWarmUp(3))).toBe(warmUp)
  })
})
