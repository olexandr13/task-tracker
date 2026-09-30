import { describe, expect, it } from 'vitest'
import {
  habitLastDays,
  habitRate,
  habitStats,
  habitTasks,
  habitWeeks,
  isHabit,
  moveToEndOfHabits,
  setDoneOnDay,
} from './habit'
import { InvalidDayError, type LocalDay } from './day'
import type { Repeat } from './repeat'
import { appendTask, sortByOrder } from './order'
import {
  addSubtask,
  completeTask,
  createTask,
  deleteTask,
  isComplete,
  setRepeat,
  setStartDay,
  setSubtaskDone,
  type Task,
} from './task'

/*
 * HAB ids refer to wiki/habits.md. Local dates on purpose: a habit is kept day by
 * day. September 2026 runs Mon 14, Tue 15, Wed 16, Thu 17, Fri 18, Sat 19, Sun 20.
 */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const DAILY: Repeat = { kind: 'daily' }

/** A task done on exactly these days, created on the first of June unless said otherwise. */
function habit(doneDays: readonly LocalDay[], repeat: Repeat | null = DAILY, created = new Date(2026, 5, 1, 8, 0)): Task {
  return { ...createTask('stretch', repeat, created), doneDays }
}

const SAT_12 = new Date(2026, 8, 12, 8, 0)

describe('isHabit (HAB-1)', () => {
  it('is a task that repeats every day, under either rule that means it', () => {
    expect(isHabit(habit([]))).toBe(true)
    expect(isHabit(habit([], { kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] }))).toBe(true)
  })

  it('is not a task that skips days, or happens once', () => {
    expect(isHabit(habit([], { kind: 'weekly', weekdays: [1, 3, 5] }))).toBe(false)
    expect(isHabit(habit([], { kind: 'monthly', day: 1 }))).toBe(false)
    expect(isHabit(habit([], null))).toBe(false)
  })
})

describe('habitTasks (HAB-2)', () => {
  it('lists the live habits in the order of the list', () => {
    const first = createTask('stretch', DAILY, WED_16)
    const oneOff = createTask('buy milk', null, WED_16)
    const second = createTask('read', DAILY, WED_16)
    const trashed = deleteTask(createTask('run', DAILY, WED_16), WED_16)
    const tasks = [first, oneOff, second, trashed].reduce<Task[]>(appendTask, [])

    expect(habitTasks([...tasks].reverse()).map((task) => task.title)).toEqual(['stretch', 'read'])
  })
})

describe('a skipped day (HAB-31)', () => {
  /** Done Mon 14 and Wed 16 with Tue 15 skipped, read on Wed 16: the day after a rest. */
  function rested(): Task {
    return { ...habit(['2026-09-14', '2026-09-16']), skippedDays: ['2026-09-15'] }
  }

  it('is read as skipped, not missed — nor pending when it is today (HAB-10)', () => {
    expect(habitLastDays(rested(), 3, WED_16).map((day) => day.state)).toEqual(['done', 'skipped', 'done'])

    const today = { ...habit(['2026-09-15']), skippedDays: ['2026-09-16'] }
    expect(habitLastDays(today, 2, WED_16).map((day) => day.state)).toEqual(['done', 'skipped'])
    // Wed 16 is the third day of this week's column.
    expect(habitWeeks(today, 1, WED_16)[0][2]).toEqual({ day: '2026-09-16', state: 'skipped' })
  })

  it('neither adds to the streak nor ends it (HAB-5, HAB-6)', () => {
    expect(habitStats(rested(), WED_16)).toEqual({ currentStreak: 2, bestStreak: 2 })

    // Today skipped and still to do: the streak counts back from yesterday, as it would anyway.
    const today = { ...habit(['2026-09-14', '2026-09-15']), skippedDays: ['2026-09-16'] }
    expect(habitStats(today, WED_16).currentStreak).toBe(2)

    // Two rests in a row are still one run.
    const twice = { ...habit(['2026-09-13', '2026-09-16']), skippedDays: ['2026-09-14', '2026-09-15'] }
    expect(habitStats(twice, WED_16)).toEqual({ currentStreak: 2, bestStreak: 2 })
  })

  it('does not save a streak from a day missed beside it (HAB-5)', () => {
    // Done Sat 12, skipped Sun 13, missed Mon 14, then done Tue 15 and Wed 16.
    const broken = { ...habit(['2026-09-12', '2026-09-15', '2026-09-16']), skippedDays: ['2026-09-13'] }

    expect(habitStats(broken, WED_16)).toEqual({ currentStreak: 2, bestStreak: 2 })
  })

  it('is left out of the days a rate counts (HAB-8)', () => {
    // Started Mon 14, done Mon and Wed with Tue skipped: two of two, not two of three.
    const task = { ...habit(['2026-09-14', '2026-09-16'], DAILY, new Date(2026, 8, 14, 8, 0)), skippedDays: ['2026-09-15'] }

    expect(habitRate(task, 7, WED_16)).toEqual({ done: 2, days: 2, percent: 100 })
  })

  it('reads as done once ticked off after all, the skip standing behind it (RPT-36)', () => {
    const task = { ...habit(['2026-09-15']), skippedDays: ['2026-09-15'] }

    expect(habitLastDays(task, 2, WED_16).map((day) => day.state)).toEqual(['done', 'pending'])
    expect(habitStats(task, WED_16).currentStreak).toBe(1)
  })
})

describe('moveToEndOfHabits (HAB-30)', () => {
  /** A one-off, two habits and a one-off, in that order, each with a number of its own. */
  function list(): Task[] {
    return [
      createTask('buy milk', null, WED_16),
      createTask('stretch', DAILY, WED_16),
      createTask('read', DAILY, WED_16),
      createTask('call the bank', null, WED_16),
    ].reduce<Task[]>(appendTask, [])
  }

  it('puts a habit after every other habit', () => {
    const tasks = list()
    const taken = tasks.map((task) => (task.title === 'buy milk' ? setRepeat(task, DAILY, WED_16) : task))

    expect(habitTasks(moveToEndOfHabits(taken, taken[0].id)).map((task) => task.title)).toEqual([
      'stretch',
      'read',
      'buy milk',
    ])
  })

  it('leaves it before the tasks filed after the habits', () => {
    const tasks = list()
    const taken = tasks.map((task) => (task.title === 'buy milk' ? setRepeat(task, DAILY, WED_16) : task))

    expect(sortByOrder(moveToEndOfHabits(taken, taken[0].id)).map((task) => task.title)).toEqual([
      'stretch',
      'read',
      'buy milk',
      'call the bank',
    ])
  })

  it('leaves the list alone for the last habit, a task that is not a habit, one in the trash and one it does not hold', () => {
    const tasks = list()
    const [oneOff, stretch, read] = tasks
    const trashed = tasks.map((task) => (task.id === read.id ? deleteTask(task, WED_16) : task))

    expect(moveToEndOfHabits(tasks, read.id)).toEqual(tasks)
    expect(moveToEndOfHabits(tasks, oneOff.id)).toEqual(tasks)
    expect(moveToEndOfHabits(trashed, read.id)).toEqual(trashed)
    expect(moveToEndOfHabits([stretch], read.id)).toEqual([stretch])
  })

  it('never modifies the list it is given', () => {
    const tasks = list()
    const taken = tasks.map((task) => (task.title === 'buy milk' ? setRepeat(task, DAILY, WED_16) : task))
    const orders = taken.map((task) => task.order)

    moveToEndOfHabits(taken, taken[0].id)

    expect(taken.map((task) => task.order)).toEqual(orders)
  })
})

describe('habitStats, streaks (HAB-5, HAB-6)', () => {
  it('counts the days in a row up to today', () => {
    expect(habitStats(habit(['2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16']), WED_16).currentStreak).toBe(4)
  })

  it('keeps the streak standing while today is still to do', () => {
    expect(habitStats(habit(['2026-09-14', '2026-09-15']), WED_16).currentStreak).toBe(2)
  })

  it('breaks the streak on a day that went by without it', () => {
    expect(habitStats(habit(['2026-09-13', '2026-09-14']), WED_16).currentStreak).toBe(0)
  })

  it('remembers the longest run there ever was', () => {
    const days = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-03', '2026-09-16']

    expect(habitStats(habit(days), WED_16).bestStreak).toBe(3)
  })

  it('has no streak before it has ever been done', () => {
    expect(habitStats(habit([]), WED_16)).toEqual({ currentStreak: 0, bestStreak: 0 })
  })
})

describe('habitStats, what counts (HAB-13)', () => {
  it('ignores a day ahead of today and a day recorded twice', () => {
    const stats = habitStats(habit(['2026-09-15', '2026-09-15', '2026-09-20']), WED_16)

    expect(stats).toEqual({ currentStreak: 1, bestStreak: 1 })
  })
})

describe('habitRate (HAB-8, HAB-12)', () => {
  it('counts every day since the task was created, leaving today out while it is still to do', () => {
    // Sat 12 to Tue 15: four days, three of them kept.
    expect(habitRate(habit(['2026-09-12', '2026-09-13', '2026-09-15'], DAILY, SAT_12), 30, WED_16)).toEqual({
      done: 3,
      days: 4,
      percent: 75,
    })
  })

  it('counts the days after creation that went by without a tick', () => {
    expect(habitRate(habit(['2026-09-15'], DAILY, SAT_12), 30, WED_16)).toEqual({ done: 1, days: 4, percent: 25 })
  })

  it('counts today once it is done', () => {
    expect(habitRate(habit(['2026-09-15', '2026-09-16'], DAILY, SAT_12), 30, WED_16)).toEqual({
      done: 2,
      days: 5,
      percent: 40,
    })
  })

  it('counts a day done before the task was created, and not the days around it', () => {
    // Aug 20 and Sat 12 to Tue 15: five days, three of them kept.
    const task = habit(['2026-08-20', '2026-09-12', '2026-09-14'], DAILY, SAT_12)

    expect(habitRate(task, 30, WED_16)).toEqual({ done: 3, days: 5, percent: 60 })
  })

  it('looks back no further than the days it is asked about', () => {
    const days = ['2026-08-01', '2026-08-18', '2026-09-09', '2026-09-10', '2026-09-16']

    // Aug 18 to Sep 16 is the last 30 days; Aug 1 falls before them.
    expect(habitRate(habit(days), 30, WED_16)).toEqual({ done: 4, days: 30, percent: 13 })
    // Sep 10 to Sep 16 is the last 7.
    expect(habitRate(habit(days), 7, WED_16)).toEqual({ done: 2, days: 7, percent: 28 })
  })

  it('has nothing to rate on the day the task is created, while it is still to do', () => {
    expect(habitRate(habit([], DAILY, WED_16), 7, WED_16)).toEqual({ done: 0, days: 0, percent: 0 })
    expect(habitRate(habit(['2026-09-20'], DAILY, WED_16), 7, WED_16)).toEqual({ done: 0, days: 0, percent: 0 })
  })
})

describe('habitWeeks (HAB-9, HAB-10)', () => {
  it('lays out whole weeks, Monday to Sunday, ending with this one', () => {
    const weeks = habitWeeks(habit([]), 2, WED_16)

    expect(weeks.map((week) => [week[0].day, week[6].day])).toEqual([
      ['2026-09-07', '2026-09-13'],
      ['2026-09-14', '2026-09-20'],
    ])
  })

  it('reads each day as done, missed, still to do or not here yet', () => {
    const [week] = habitWeeks(habit(['2026-09-14']), 1, WED_16)

    expect(week.map((day) => day.state)).toEqual(['done', 'missed', 'pending', 'future', 'future', 'future', 'future'])
  })

  it('leaves the days before the task was created untracked, unless they were done (HAB-12)', () => {
    const tuesday = new Date(2026, 8, 15, 20, 0)
    const [lastWeek, week] = habitWeeks(habit(['2026-09-09'], DAILY, tuesday), 2, WED_16)

    expect(lastWeek.slice(0, 4).map((day) => day.state)).toEqual(['untracked', 'untracked', 'done', 'untracked'])
    expect(week.slice(0, 3).map((day) => day.state)).toEqual(['untracked', 'missed', 'pending'])
  })

  it('tracks from the day the habit was told to start, not from the day it was written (DUE-18)', () => {
    const [week] = habitWeeks(setStartDay(habit([]), '2026-09-15'), 1, WED_16)

    expect(week.slice(0, 3).map((day) => day.state)).toEqual(['untracked', 'missed', 'pending'])
  })

  it('reads today as done once it is', () => {
    expect(habitWeeks(habit(['2026-09-16']), 1, WED_16)[0][2].state).toBe('done')
  })
})

describe('habitLastDays (HAB-21)', () => {
  it('reads the last days up to today, oldest first', () => {
    const days = habitLastDays(habit(['2026-09-11', '2026-09-14', '2026-09-15'], DAILY, SAT_12), 7, WED_16)

    expect(days.map((day) => day.day)).toEqual([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
    ])
    expect(days.map((day) => day.state)).toEqual(['untracked', 'done', 'missed', 'missed', 'done', 'done', 'pending'])
  })

  it('reads today as done once it is', () => {
    expect(habitLastDays(habit(['2026-09-16']), 7, WED_16).at(-1)?.state).toBe('done')
  })
})

describe('setDoneOnDay (HAB-16 to HAB-20)', () => {
  const MON_14 = new Date(2026, 8, 14, 9, 0)

  it('records an earlier day, leaving the days around it', () => {
    const task = setDoneOnDay(habit(['2026-09-13', '2026-09-15']), '2026-09-14', true, WED_16)

    expect(task.doneDays).toEqual(['2026-09-13', '2026-09-14', '2026-09-15'])
  })

  it('takes an earlier day back', () => {
    expect(setDoneOnDay(habit(['2026-09-13', '2026-09-15']), '2026-09-13', false, WED_16).doneDays).toEqual([
      '2026-09-15',
    ])
  })

  it('moves the completion to a backfilled day later than the last one, at its start', () => {
    const task = setDoneOnDay(completeTask(createTask('stretch', DAILY, MON_14), MON_14), '2026-09-15', true, WED_16)

    expect(task.completedAt).toBe(new Date(2026, 8, 15).toISOString())
    expect(task.status).toBe('done')
    expect(isComplete(task, WED_16)).toBe(false)
  })

  it('keeps a later completion when an older day is backfilled', () => {
    const done = completeTask(createTask('stretch', DAILY, MON_14), WED_16)

    expect(setDoneOnDay(done, '2026-09-14', true, WED_16).completedAt).toBe(done.completedAt)
  })

  it('falls back to the day before when the last day is taken back, and to nothing when none is left', () => {
    const twice = setDoneOnDay(habit(['2026-09-13']), '2026-09-15', true, WED_16)
    const once = setDoneOnDay(twice, '2026-09-15', false, WED_16)

    expect(once.completedAt).toBe(new Date(2026, 8, 13).toISOString())
    expect(setDoneOnDay(once, '2026-09-13', false, WED_16)).toMatchObject({ status: 'todo', completedAt: null })
  })

  it('ticks today through the task itself, which an open checklist refuses (HAB-17, CHK-11)', () => {
    const task = addSubtask(createTask('stretch', DAILY, MON_14), 'hamstrings', MON_14)

    expect(setDoneOnDay(task, '2026-09-16', true, WED_16)).toBe(task)

    // The items are the way through to the box, which is what records the day (CHK-9).
    const ticked = setSubtaskDone(task, task.subtasks[0].id, true, WED_16)

    expect(isComplete(ticked, WED_16)).toBe(false)

    const done = setDoneOnDay(ticked, '2026-09-16', true, WED_16)

    expect(isComplete(done, WED_16)).toBe(true)
    expect(done.doneDays).toEqual(['2026-09-16'])
    expect(isComplete(setDoneOnDay(done, '2026-09-16', false, WED_16), WED_16)).toBe(false)
  })

  it('leaves a day still to come, a task that is not a habit, and a day already so, as they are', () => {
    const daily = habit(['2026-09-15'])
    const weekly = habit([], { kind: 'weekly', weekdays: [1] })

    expect(setDoneOnDay(daily, '2026-09-17', true, WED_16)).toBe(daily)
    expect(setDoneOnDay(weekly, '2026-09-15', true, WED_16)).toBe(weekly)
    expect(setDoneOnDay(daily, '2026-09-15', true, WED_16)).toBe(daily)
    expect(setDoneOnDay(daily, '2026-09-14', false, WED_16)).toBe(daily)
  })

  it('refuses something that is not a day', () => {
    expect(() => setDoneOnDay(habit([]), '2026-02-30', true, WED_16)).toThrow(InvalidDayError)
  })

  it('never touches the task it was given', () => {
    const task = habit(['2026-09-15'])
    setDoneOnDay(task, '2026-09-14', true, WED_16)

    expect(task.doneDays).toEqual(['2026-09-15'])
  })
})
