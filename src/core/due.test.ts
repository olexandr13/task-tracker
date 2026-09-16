import { describe, expect, it } from 'vitest'
import { dueDay, isInToday, isOverdue } from './due'
import type { Repeat } from './repeat'
import { completeTask, createTask, deleteTask, setDueDate, type Task } from './task'

// Local dates on purpose: due days are local days. September 2026 runs
// Mon 14, Tue 15, Wed 16, Thu 17, Fri 18.
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

function repeating(repeat: Repeat, createdAt: Date = MON_14): Task {
  return createTask('a task', repeat, createdAt)
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
})

describe('isInToday, to do', () => {
  it('holds what is due today', () => {
    expect(isInToday(dueOn('2026-09-16'), WED_16)).toBe(true)
  })

  it('holds what is overdue, so a missed day does not drop out of sight', () => {
    expect(isInToday(dueOn('2026-09-10'), WED_16)).toBe(true)
  })

  it('leaves out what is due later, and what has no day', () => {
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

  it('never takes in a task with no day, however recently it was ticked', () => {
    expect(isInToday(completeTask(dueOn(null), WED_16), WED_16_EVENING)).toBe(false)
  })

  it('keeps a repeating task ticked today, and lets go of one ticked for an earlier occurrence', () => {
    expect(isInToday(completeTask(repeating(DAILY), WED_16), WED_16_EVENING)).toBe(true)
    expect(isInToday(completeTask(repeating(MONDAYS), MON_14), WED_16)).toBe(false)
    expect(isInToday(completeTask(repeating(MONDAYS), WED_16), WED_16_EVENING)).toBe(true)
  })
})
