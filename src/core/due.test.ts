import { describe, expect, it } from 'vitest'
import {
  canSkipOccurrence,
  dueDay,
  dueMoment,
  dueReminders,
  firstDueDay,
  isInPeriod,
  isOverdue,
  lastDayOf,
  nextWeekDueDay,
  skipOccurrence,
  splitOverdue,
  standingReminders,
} from './due'
import type { Repeat } from './repeat'
import {
  completeTask,
  createTask,
  deleteTask,
  duplicateTask,
  setDueDate,
  setDueTime,
  setStartDay,
  renameTask,
  uncompleteTask,
  type Task,
} from './task'

// Local dates on purpose: due days are local days. September 2026 runs
// Mon 14, Tue 15, Wed 16, Thu 17, Fri 18, and the week closes on Sun 20.
const MON_14 = new Date(2026, 8, 14, 9, 0)
const TUE_15 = new Date(2026, 8, 15, 9, 0)
const WED_16 = new Date(2026, 8, 16, 9, 0)
const WED_16_EVENING = new Date(2026, 8, 16, 21, 0)

const DAILY: Repeat = { kind: 'daily' }
const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }

/** A one-off written on the Monday, due on `day`. */
function dueOn(day: string | null): Task {
  return setDueDate(createTask('a task', null, MON_14), day)
}

/** A one-off with no day at all, written on `createdAt`. */
function undated(createdAt: Date = MON_14): Task {
  return createTask('a task', null, createdAt)
}

function repeating(repeat: Repeat, createdAt: Date = MON_14): Task {
  return createTask('a task', repeat, createdAt)
}

/** A repeating task written on the Monday whose rule was told to start on `day`. */
function startedOnDay(repeat: Repeat, day: string, createdAt: Date = MON_14): Task {
  return setStartDay(createTask('a task', repeat, createdAt), day)
}

function isInToday(task: Task, now: Date): boolean {
  return isInPeriod(task, 'today', now)
}

function isInWeek(task: Task, now: Date): boolean {
  return isInPeriod(task, 'week', now)
}

function isInMonth(task: Task, now: Date): boolean {
  return isInPeriod(task, 'month', now)
}

describe('dueDay', () => {
  it('is a one-off’s own date, or nothing', () => {
    expect(dueDay(dueOn('2026-09-18'), WED_16)).toBe('2026-09-18')
    expect(dueDay(dueOn(null), WED_16)).toBeNull()
  })

  it('is the occurrence in play for a repeating task', () => {
    expect(dueDay(repeating(DAILY), WED_16)).toBe('2026-09-16')
    expect(dueDay(repeating(MONDAYS), WED_16)).toBe('2026-09-14')
  })

  it('is nothing while the occurrence in play came before the task was written', () => {
    const writtenTuesday = repeating(MONDAYS, TUE_15)

    expect(dueDay(writtenTuesday, WED_16)).toBeNull()
    expect(dueDay(writtenTuesday, new Date(2026, 8, 21, 9, 0))).toBe('2026-09-21')
  })

  it('is the first occurrence from the day a rule was told to start on (DUE-18)', () => {
    // Friday the 18th, so a daily task starts there and a Monday task on the 21st.
    expect(dueDay(startedOnDay(DAILY, '2026-09-18'), WED_16)).toBe('2026-09-18')
    expect(dueDay(startedOnDay(MONDAYS, '2026-09-18'), WED_16)).toBe('2026-09-21')
  })

  it('is the occurrence in play again once the start has gone by', () => {
    expect(dueDay(startedOnDay(DAILY, '2026-09-14'), WED_16)).toBe('2026-09-16')
    expect(dueDay(startedOnDay(MONDAYS, '2026-09-14'), WED_16)).toBe('2026-09-14')
  })

  it('takes a start day over the day the task was written, either way round', () => {
    // Written on the Tuesday, so the Monday before asked nothing of it — until
    // that Monday is the day the rule was told to start on.
    const writtenTuesday = repeating(MONDAYS, TUE_15)

    expect(dueDay(setStartDay(writtenTuesday, '2026-09-14'), WED_16)).toBe('2026-09-14')
    expect(dueDay(setStartDay(writtenTuesday, '2026-09-21'), WED_16)).toBe('2026-09-21')
  })
})

describe('firstDueDay', () => {
  it('is the start itself where the rule falls on it, and the next day it does otherwise', () => {
    expect(firstDueDay(DAILY, '2026-09-18')).toBe('2026-09-18')
    expect(firstDueDay(MONDAYS, '2026-09-14')).toBe('2026-09-14')
    expect(firstDueDay(MONDAYS, '2026-09-15')).toBe('2026-09-21')
  })
})

describe('isOverdue', () => {
  it('is a day gone by with the task still to do', () => {
    expect(isOverdue(dueOn('2026-09-15'), WED_16)).toBe(true)
  })

  it('is not today, not later, and not a task with no day', () => {
    expect(isOverdue(dueOn('2026-09-16'), WED_16_EVENING)).toBe(false)
    expect(isOverdue(dueOn('2026-09-17'), WED_16)).toBe(false)
    expect(isOverdue(dueOn(null), WED_16)).toBe(false)
  })

  it('is not a task that was done, however late', () => {
    expect(isOverdue(completeTask(dueOn('2026-09-14'), WED_16), WED_16)).toBe(false)
  })

  it('is a repeating task whose occurrence went by undone', () => {
    expect(isOverdue(repeating(MONDAYS), WED_16)).toBe(true)
    expect(isOverdue(completeTask(repeating(MONDAYS), TUE_15), WED_16)).toBe(false)
    expect(isOverdue(repeating(DAILY), WED_16)).toBe(false)
  })

  it('is today\'s hour once it has struck, and not before it', () => {
    const nine = setDueTime(dueOn('2026-09-16'), '09:00')

    expect(isOverdue(nine, new Date(2026, 8, 16, 8, 59))).toBe(false)
    expect(isOverdue(nine, new Date(2026, 8, 16, 9, 1))).toBe(true)
    // An hour later in the day is not late all morning for sharing its day.
    expect(isOverdue(setDueTime(dueOn('2026-09-16'), '22:00'), WED_16_EVENING)).toBe(false)
  })

  it('is a repeating task past today\'s hour, and not one still to come', () => {
    const nine = setDueTime(repeating(DAILY), '09:00')

    expect(isOverdue(nine, new Date(2026, 8, 16, 8, 0))).toBe(false)
    expect(isOverdue(nine, WED_16_EVENING)).toBe(true)
    expect(isOverdue(completeTask(nine, WED_16), WED_16_EVENING)).toBe(false)
  })
})

describe('dueMoment', () => {
  it('is the hour on the day the task is due', () => {
    expect(dueMoment(setDueTime(dueOn('2026-09-16'), '09:00'), WED_16)).toEqual(new Date(2026, 8, 16, 9, 0))
  })

  it('moves with a repeating task\'s occurrence, without anything being stored', () => {
    const nine = setDueTime(repeating(DAILY), '09:00')

    expect(dueMoment(nine, TUE_15)).toEqual(new Date(2026, 8, 15, 9, 0))
    expect(dueMoment(nine, WED_16)).toEqual(new Date(2026, 8, 16, 9, 0))
  })

  it('is nothing for a task due on a day with no hour, or on no day at all', () => {
    expect(dueMoment(dueOn('2026-09-16'), WED_16)).toBeNull()
    expect(dueMoment(undated(), WED_16)).toBeNull()
  })
})

describe('dueReminders', () => {
  const NINE = new Date(2026, 8, 16, 9, 0)
  const BEFORE = new Date(2026, 8, 16, 8, 59)
  const AFTER = new Date(2026, 8, 16, 9, 1)

  /** A one-off due on the Wednesday at `time`. */
  function at(time: string, title = 'a task'): Task {
    return setDueTime(renameTask(dueOn('2026-09-16'), title), time)
  }

  it('names a task whose hour struck in the stretch watched', () => {
    expect(dueReminders([at('09:00', 'write')], BEFORE, AFTER)).toEqual([
      { taskId: expect.any(String), title: 'write', at: NINE },
    ])
  })

  it('says nothing for an hour still to come, or one already behind the stretch', () => {
    expect(dueReminders([at('09:00')], AFTER, new Date(2026, 8, 16, 10, 0))).toEqual([])
    expect(dueReminders([at('10:00')], BEFORE, AFTER)).toEqual([])
  })

  it('says nothing twice: the stretch is open at its start', () => {
    // The tick that caught nine carries its own moment forward as the next start.
    expect(dueReminders([at('09:00')], NINE, AFTER)).toEqual([])
  })

  it('says nothing about a task already done, deleted, or due on no day', () => {
    expect(dueReminders([completeTask(at('09:00'), BEFORE)], BEFORE, AFTER)).toEqual([])
    expect(dueReminders([deleteTask(at('09:00'), BEFORE)], BEFORE, AFTER)).toEqual([])
    expect(dueReminders([dueOn('2026-09-16')], BEFORE, AFTER)).toEqual([])
  })

  it('names a repeating task on the hour of the occurrence in play', () => {
    const daily = setDueTime(repeating(DAILY), '09:00')

    expect(dueReminders([daily], BEFORE, AFTER).map((one) => one.at)).toEqual([NINE])
  })

  it('names every hour that struck together, earliest first', () => {
    const eight = new Date(2026, 8, 16, 8, 0)
    const tasks = [at('09:00', 'later'), at('08:30', 'earlier')]

    expect(dueReminders(tasks, eight, AFTER).map((one) => one.title)).toEqual(['earlier', 'later'])
  })
})

describe('standingReminders', () => {
  const NINE = new Date(2026, 8, 16, 9, 0)

  function standing(task: Task) {
    return [{ taskId: task.id, title: task.title, at: NINE }]
  }

  it('keeps a reminder whose task is still to do, named as it is named now', () => {
    const task = setDueTime(dueOn('2026-09-16'), '09:00')
    const renamed = renameTask(task, 'file the taxes')

    expect(standingReminders(standing(task), [renamed], WED_16_EVENING)).toEqual([
      { taskId: task.id, title: 'file the taxes', at: NINE },
    ])
  })

  it('drops one whose task is done, deleted or gone', () => {
    const task = setDueTime(dueOn('2026-09-16'), '09:00')

    expect(standingReminders(standing(task), [completeTask(task, WED_16)], WED_16_EVENING)).toEqual([])
    expect(standingReminders(standing(task), [deleteTask(task, WED_16)], WED_16_EVENING)).toEqual([])
    expect(standingReminders(standing(task), [], WED_16_EVENING)).toEqual([])
  })

  it('keeps the moment the hour struck, whatever the day has become since', () => {
    const task = setDueTime(dueOn('2026-09-16'), '09:00')
    const moved = setDueDate(task, '2026-09-30')

    expect(standingReminders(standing(task), [moved], WED_16_EVENING)[0]?.at).toEqual(NINE)
  })
})

describe('splitOverdue', () => {
  /** A one-off due on `day`, titled by it so the runs read plainly. */
  function task(title: string, day: string | null): Task {
    return { ...setDueDate(createTask(title, null, MON_14), day), id: title }
  }

  it('takes the overdue out of the run and leaves the rest', () => {
    const tasks = [task('late', '2026-09-14'), task('today', '2026-09-16'), task('someday', null)]
    const { overdue, rest } = splitOverdue(tasks, WED_16)

    expect(overdue.map((one) => one.title)).toEqual(['late'])
    expect(rest.map((one) => one.title)).toEqual(['today', 'someday'])
  })

  it('keeps the order each run was given', () => {
    const tasks = [task('late', '2026-09-14'), task('today', '2026-09-16'), task('later', '2026-09-13')]
    const { overdue, rest } = splitOverdue(tasks, WED_16)

    expect(overdue.map((one) => one.title)).toEqual(['late', 'later'])
    expect(rest.map((one) => one.title)).toEqual(['today'])
  })

  it('leaves a done task in the rest, however late it was finished', () => {
    const tasks = [completeTask(task('late', '2026-09-14'), WED_16)]
    const { overdue, rest } = splitOverdue(tasks, WED_16)

    expect(overdue).toHaveLength(0)
    expect(rest).toHaveLength(1)
  })

  it('follows the day it is asked about, so a page left open moves a task along', () => {
    const tasks = [task('tuesday', '2026-09-15')]

    expect(splitOverdue(tasks, TUE_15).overdue).toHaveLength(0)
    expect(splitOverdue(tasks, WED_16).overdue).toHaveLength(1)
  })

  it('never modifies the list it is given', () => {
    const tasks = [task('late', '2026-09-14')]
    splitOverdue(tasks, WED_16)

    expect(tasks).toHaveLength(1)
  })
})

describe('isInToday, to do', () => {
  it('holds what is due today', () => {
    expect(isInToday(dueOn('2026-09-16'), WED_16)).toBe(true)
  })

  it('holds what is overdue, so a missed day does not drop out of sight', () => {
    expect(isInToday(dueOn('2026-09-10'), WED_16)).toBe(true)
  })

  it('leaves out what is due later, and what has no day and is still to do', () => {
    expect(isInToday(dueOn('2026-09-17'), WED_16)).toBe(false)
    expect(isInToday(dueOn(null), WED_16)).toBe(false)
  })

  it('holds a daily task every day, and a weekly one on its days and after them until done', () => {
    expect(isInToday(repeating(DAILY), WED_16)).toBe(true)
    expect(isInToday(repeating(MONDAYS), MON_14)).toBe(true)
    expect(isInToday(repeating(MONDAYS), WED_16)).toBe(true)
  })

  it('leaves out a repeating task that has not come round since it was written', () => {
    expect(isInToday(repeating(MONDAYS, TUE_15), WED_16)).toBe(false)
  })

  it('leaves out the trash', () => {
    expect(isInToday(deleteTask(dueOn('2026-09-16'), TUE_15), WED_16)).toBe(false)
  })
})

describe('isInToday, done', () => {
  it('keeps what was due today', () => {
    expect(isInToday(completeTask(dueOn('2026-09-16'), WED_16), WED_16_EVENING)).toBe(true)
  })

  it('keeps a task due today even when it was finished ahead, on an earlier day', () => {
    expect(isInToday(completeTask(dueOn('2026-09-16'), MON_14), WED_16)).toBe(true)
  })

  it('keeps an overdue task finished today, so ticking it off does not make it vanish', () => {
    expect(isInToday(completeTask(dueOn('2026-09-14'), WED_16), WED_16_EVENING)).toBe(true)
  })

  it('lets an overdue task finished on an earlier day go', () => {
    expect(isInToday(completeTask(dueOn('2026-09-14'), TUE_15), WED_16)).toBe(false)
  })

  it('leaves a task finished ahead of its day on that day', () => {
    expect(isInToday(completeTask(dueOn('2026-09-18'), WED_16), WED_16_EVENING)).toBe(false)
  })

  it('takes in a task with no day ticked today, the only day it has', () => {
    expect(isInToday(completeTask(undated(), WED_16), WED_16_EVENING)).toBe(true)
  })

  it('lets go of a task with no day ticked on an earlier day', () => {
    expect(isInToday(completeTask(undated(), MON_14), WED_16)).toBe(false)
  })

  it('keeps a repeating task ticked today, and lets go of one ticked for an earlier occurrence', () => {
    expect(isInToday(completeTask(repeating(DAILY), WED_16), WED_16_EVENING)).toBe(true)
    expect(isInToday(completeTask(repeating(MONDAYS), MON_14), WED_16)).toBe(false)
    expect(isInToday(completeTask(repeating(MONDAYS), WED_16), WED_16_EVENING)).toBe(true)
  })
})

describe('isInWeek, to do', () => {
  it('holds what is due any day up to Sunday, today and overdue included', () => {
    expect(isInWeek(dueOn('2026-09-16'), WED_16)).toBe(true)
    expect(isInWeek(dueOn('2026-09-20'), WED_16)).toBe(true)
    expect(isInWeek(dueOn('2026-09-01'), WED_16)).toBe(true)
  })

  it('leaves out what is due next week, and what has no day and is still to do', () => {
    expect(isInWeek(dueOn('2026-09-21'), WED_16)).toBe(false)
    expect(isInWeek(dueOn(null), WED_16)).toBe(false)
  })

  it('holds a repeating task on its occurrence in play, not on one still to come', () => {
    const fridays = repeating({ kind: 'weekly', weekdays: [5] })

    expect(isInWeek(repeating(DAILY), WED_16)).toBe(true)
    expect(isInWeek(repeating(MONDAYS), WED_16)).toBe(true)
    expect(isInWeek(fridays, WED_16)).toBe(false)
    expect(isInWeek(fridays, new Date(2026, 8, 18, 9, 0))).toBe(true)
  })

  it('leaves out the trash', () => {
    expect(isInWeek(deleteTask(dueOn('2026-09-18'), TUE_15), WED_16)).toBe(false)
  })
})

describe('isInWeek, done', () => {
  it('keeps what was due this week, whenever it was finished', () => {
    expect(isInWeek(completeTask(dueOn('2026-09-14'), MON_14), WED_16)).toBe(true)
    expect(isInWeek(completeTask(dueOn('2026-09-20'), TUE_15), WED_16)).toBe(true)
  })

  it('keeps an overdue task finished this week, and lets go of one finished before it', () => {
    expect(isInWeek(completeTask(dueOn('2026-09-10'), TUE_15), WED_16)).toBe(true)
    expect(isInWeek(completeTask(dueOn('2026-09-10'), new Date(2026, 8, 12, 9, 0)), WED_16)).toBe(false)
  })

  it('leaves a task finished ahead of a later week in that week', () => {
    expect(isInWeek(completeTask(dueOn('2026-09-22'), WED_16), WED_16_EVENING)).toBe(false)
  })

  it('keeps a task with no day ticked this week, and lets go of one ticked before it', () => {
    expect(isInWeek(completeTask(undated(), MON_14), WED_16)).toBe(true)
    expect(isInWeek(completeTask(undated(new Date(2026, 8, 7, 9, 0)), new Date(2026, 8, 12, 9, 0)), WED_16)).toBe(false)
  })

  it('keeps a repeating task ticked for an occurrence this week', () => {
    expect(isInWeek(completeTask(repeating(MONDAYS), MON_14), WED_16)).toBe(true)
  })
})

describe('isInMonth', () => {
  it('holds what is due any day up to the end of the month, today and overdue included', () => {
    expect(isInMonth(dueOn('2026-09-30'), WED_16)).toBe(true)
    expect(isInMonth(dueOn('2026-08-20'), WED_16)).toBe(true)
  })

  it('leaves out what is due next month, and what has no day and is still to do', () => {
    expect(isInMonth(dueOn('2026-10-01'), WED_16)).toBe(false)
    expect(isInMonth(dueOn(null), WED_16)).toBe(false)
  })

  it('keeps what was due this month, and an overdue task finished this month', () => {
    expect(isInMonth(completeTask(dueOn('2026-09-02'), new Date(2026, 8, 1, 9, 0)), WED_16)).toBe(true)
    expect(isInMonth(completeTask(dueOn('2026-08-20'), MON_14), WED_16)).toBe(true)
    expect(isInMonth(completeTask(dueOn('2026-08-20'), new Date(2026, 7, 31, 9, 0)), WED_16)).toBe(false)
  })

  it('keeps a task with no day ticked this month, and lets go of one ticked before it', () => {
    expect(isInMonth(completeTask(undated(new Date(2026, 8, 1, 9, 0)), new Date(2026, 8, 2, 9, 0)), WED_16)).toBe(true)
    expect(isInMonth(completeTask(undated(new Date(2026, 7, 20, 9, 0)), new Date(2026, 7, 31, 9, 0)), WED_16)).toBe(false)
  })

  it('holds a monthly task on its occurrence in play, not on one still to come', () => {
    const on25th = repeating({ kind: 'monthly', day: 25 }, new Date(2026, 8, 1, 9, 0))

    expect(isInMonth(on25th, WED_16)).toBe(false)
    expect(isInMonth(on25th, new Date(2026, 8, 25, 9, 0))).toBe(true)
  })
})

describe('lastDayOf', () => {
  it('is today for today', () => {
    expect(lastDayOf('today', WED_16_EVENING)).toBe('2026-09-16')
  })

  it('is the Sunday that closes this week, from any day of it — Sunday included', () => {
    expect(lastDayOf('week', MON_14)).toBe('2026-09-20')
    expect(lastDayOf('week', new Date(2026, 8, 20, 23, 59))).toBe('2026-09-20')
    expect(lastDayOf('week', new Date(2026, 11, 30, 9, 0))).toBe('2027-01-03')
  })

  it('is the last day of this month, however long it runs', () => {
    expect(lastDayOf('month', WED_16)).toBe('2026-09-30')
    expect(lastDayOf('month', new Date(2028, 1, 1, 0, 0))).toBe('2028-02-29')
    expect(lastDayOf('month', new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
})

describe('nextWeekDueDay', () => {
  it('is the Sunday that closes next week, from any day of this one', () => {
    expect(nextWeekDueDay(MON_14)).toBe('2026-09-27')
    expect(nextWeekDueDay(WED_16)).toBe('2026-09-27')
    expect(nextWeekDueDay(new Date(2026, 8, 20, 23, 0))).toBe('2026-09-27')
  })

  it('crosses the end of a month and a year', () => {
    expect(nextWeekDueDay(new Date(2026, 11, 30, 9, 0))).toBe('2027-01-10')
  })
})

describe('skipOccurrence', () => {
  it('moves a repeating task on to the rule\'s next day, not done (RPT-34)', () => {
    const skipped = skipOccurrence(repeating(DAILY), WED_16)

    expect(skipped.skippedDays).toEqual(['2026-09-16'])
    expect(dueDay(skipped, WED_16)).toBe('2026-09-17')
    expect(skipped.completedAt).toBeNull()
    expect(skipped.doneDays).toEqual([])
  })

  it('passes over a missed occurrence, so it is no longer overdue (RPT-34)', () => {
    const missed = repeating(MONDAYS)
    expect(isOverdue(missed, WED_16)).toBe(true)

    const skipped = skipOccurrence(missed, WED_16)

    expect(dueDay(skipped, WED_16)).toBe('2026-09-21')
    expect(isOverdue(skipped, WED_16)).toBe(false)
    expect(isInWeek(skipped, WED_16)).toBe(false)
  })

  it('takes the task out of Today, and it comes back on its next day (RPT-34)', () => {
    const skipped = skipOccurrence(repeating(DAILY), WED_16)

    expect(isInToday(skipped, WED_16)).toBe(false)
    expect(isInToday(skipped, new Date(2026, 8, 17, 9, 0))).toBe(true)
  })

  it('passes over the next one too when done again (RPT-35)', () => {
    const twice = skipOccurrence(skipOccurrence(repeating(DAILY), WED_16), WED_16)

    expect(twice.skippedDays).toEqual(['2026-09-16', '2026-09-17'])
    expect(dueDay(twice, WED_16)).toBe('2026-09-18')
  })

  it('reads as done on the occurrence in play once ticked off after all, and skipped again once unticked (RPT-36)', () => {
    const skipped = skipOccurrence(repeating(DAILY), WED_16)
    const done = completeTask(skipped, WED_16_EVENING)

    expect(dueDay(done, WED_16_EVENING)).toBe('2026-09-16')
    expect(isInToday(done, WED_16_EVENING)).toBe(true)
    expect(dueDay(uncompleteTask(done, WED_16_EVENING), WED_16_EVENING)).toBe('2026-09-17')
  })

  it('leaves alone a one-off, a done occurrence and one from before the task was written (RPT-34)', () => {
    const oneOff = dueOn('2026-09-16')
    const done = completeTask(repeating(DAILY), WED_16)
    const writtenTuesday = repeating(MONDAYS, TUE_15)

    for (const task of [oneOff, done, writtenTuesday]) {
      expect(canSkipOccurrence(task, WED_16)).toBe(false)
      expect(skipOccurrence(task, WED_16)).toBe(task)
    }
  })

  it('is not carried over to a copy (TASK-51)', () => {
    expect(duplicateTask(skipOccurrence(repeating(DAILY), WED_16), WED_16).skippedDays).toEqual([])
  })
})

describe('reopening a missed occurrence', () => {
  it('passes the missed day over, so it is no longer overdue (RPT-38)', () => {
    const done = completeTask(repeating(MONDAYS), WED_16)
    expect(isOverdue(done, WED_16)).toBe(false)

    const reopened = uncompleteTask(done, WED_16)

    expect(reopened.skippedDays).toEqual(['2026-09-14'])
    expect(dueDay(reopened, WED_16)).toBe('2026-09-21')
    expect(isOverdue(reopened, WED_16)).toBe(false)
    expect(isInWeek(reopened, WED_16)).toBe(false)
  })

  it('brings the missed day back when the task is ticked off again (RPT-36)', () => {
    const again = completeTask(uncompleteTask(completeTask(repeating(MONDAYS), WED_16), WED_16), WED_16)

    expect(dueDay(again, WED_16)).toBe('2026-09-14')
    expect(isInToday(again, WED_16)).toBe(true)
  })

  it('leaves a task whose occurrence is still in play on its day (RPT-38)', () => {
    const reopened = uncompleteTask(completeTask(repeating(DAILY), WED_16), WED_16)

    expect(reopened.skippedDays).toEqual([])
    expect(dueDay(reopened, WED_16)).toBe('2026-09-16')
    expect(isInToday(reopened, WED_16)).toBe(true)
  })

  it('passes over nothing from before the task was written (DUE-11)', () => {
    const writtenTuesday = repeating(MONDAYS, TUE_15)
    const reopened = uncompleteTask(completeTask(writtenTuesday, WED_16), WED_16)

    expect(reopened.skippedDays).toEqual([])
    expect(dueDay(reopened, WED_16)).toBeNull()
  })
})
