import { describe, expect, it } from 'vitest'
import { skipOccurrence } from './due'
import { periodRange, summarize } from './progress'
import type { Repeat } from './repeat'
import { addSubtask, completeTask, createTask, deleteTask, setDueDate, setStartDay, setSubtaskDone, type Task } from './task'

// Local dates on purpose: periods are made of local days. September 2026 runs
// Mon 14, Tue 15, Wed 16, Thu 17, Fri 18, Sat 19, Sun 20, Mon 21.
const TUE_15 = new Date(2026, 8, 15, 9, 0)
const MON_14_EVENING = new Date(2026, 8, 14, 19, 0)
const TUE_15_EVENING = new Date(2026, 8, 15, 21, 0)
const AUG_20 = new Date(2026, 7, 20, 12, 0)

const DAILY: Repeat = { kind: 'daily' }
const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }
const ON_THE_20TH: Repeat = { kind: 'monthly', day: 20 }

function task(repeat: Repeat | null, completedAt: Date | null = null): Task {
  const created = createTask('a task', repeat, MON_14_EVENING)
  return completedAt === null ? created : completeTask(created, completedAt)
}

describe('periodRange', () => {
  it('covers the single day that today is', () => {
    expect(periodRange('today', TUE_15)).toEqual({ start: new Date(2026, 8, 15), end: new Date(2026, 8, 16) })
  })

  it('runs the week from Monday to Sunday', () => {
    expect(periodRange('week', TUE_15)).toEqual({ start: new Date(2026, 8, 14), end: new Date(2026, 8, 21) })
  })

  it('keeps Sunday in the week that began the Monday before it', () => {
    const sunday = new Date(2026, 8, 20, 22, 0)

    expect(periodRange('week', sunday)).toEqual({ start: new Date(2026, 8, 14), end: new Date(2026, 8, 21) })
  })

  it('lets a week run past the end of the month', () => {
    const wednesday = new Date(2026, 8, 30, 9, 0)

    expect(periodRange('week', wednesday)).toEqual({ start: new Date(2026, 8, 28), end: new Date(2026, 9, 5) })
  })

  it('runs the month from the first to the first of the next', () => {
    expect(periodRange('month', TUE_15)).toEqual({ start: new Date(2026, 8, 1), end: new Date(2026, 9, 1) })
  })

  it('rolls the month over the turn of the year', () => {
    expect(periodRange('month', new Date(2026, 11, 15, 9, 0))).toEqual({
      start: new Date(2026, 11, 1),
      end: new Date(2027, 0, 1),
    })
  })
})

describe('summarize, which tasks a period counts', () => {
  it('counts a repeating task in every period one of its occurrences falls in', () => {
    const tasks = [task(MONDAYS)]

    expect(summarize(tasks, 'today', TUE_15).total).toBe(0)
    expect(summarize(tasks, 'week', TUE_15).total).toBe(1)
    expect(summarize(tasks, 'month', TUE_15).total).toBe(1)
  })

  it('counts a daily task in all three', () => {
    const tasks = [task(DAILY)]

    expect(summarize(tasks, 'today', TUE_15).total).toBe(1)
    expect(summarize(tasks, 'week', TUE_15).total).toBe(1)
    expect(summarize(tasks, 'month', TUE_15).total).toBe(1)
  })

  it('leaves a monthly task out of the days and weeks it does not land in', () => {
    const tasks = [task(ON_THE_20TH)]

    expect(summarize(tasks, 'today', TUE_15).total).toBe(0)
    // The 20th is the Sunday of the week that starts Mon the 14th.
    expect(summarize(tasks, 'week', TUE_15).total).toBe(1)
    expect(summarize(tasks, 'month', TUE_15).total).toBe(1)
  })

  it('counts a task that happens once with no day in every period, as the lists do (LIST-5)', () => {
    const tasks = [task(null)]

    expect(summarize(tasks, 'today', TUE_15).total).toBe(1)
    expect(summarize(tasks, 'week', TUE_15).total).toBe(1)
    expect(summarize(tasks, 'month', TUE_15).total).toBe(1)
  })

  it('counts a task with no day once a period, however old it is', () => {
    const written = createTask('a task', null, AUG_20)

    expect(summarize([written], 'today', TUE_15)).toEqual({ completed: 0, total: 1, remaining: 1, percent: 0 })
  })

  it('drops a task that happens once once it is done and its period has passed', () => {
    const tasks = [task(null, AUG_20)]

    expect(summarize(tasks, 'today', TUE_15)).toEqual({ completed: 0, total: 0, remaining: 0, percent: 0 })
    expect(summarize(tasks, 'month', TUE_15)).toEqual({ completed: 0, total: 0, remaining: 0, percent: 0 })
  })

  it('counts nothing when there are no tasks', () => {
    expect(summarize([], 'today', TUE_15)).toEqual({ completed: 0, total: 0, remaining: 0, percent: 0 })
  })
})

describe('summarize, a task that happens once on a given day', () => {
  function dueOn(day: string, completedAt: Date | null = null): Task {
    return setDueDate(task(null, completedAt), day)
  }

  it('belongs to the period its day falls in, and not to the ones before it', () => {
    const friday = [dueOn('2026-09-18')]

    expect(summarize(friday, 'today', TUE_15).total).toBe(0)
    expect(summarize(friday, 'week', TUE_15).total).toBe(1)
    expect(summarize(friday, 'month', TUE_15).total).toBe(1)
  })

  it('stays in every later period while it is still to do, so letting it slip keeps it counted', () => {
    const lastMonth = [dueOn('2026-08-31')]

    expect(summarize(lastMonth, 'today', TUE_15)).toMatchObject({ completed: 0, total: 1 })
    expect(summarize(lastMonth, 'week', TUE_15)).toMatchObject({ completed: 0, total: 1 })
  })

  it('counts in the period it was done in, like any other task', () => {
    const doneToday = [dueOn('2026-10-02', TUE_15_EVENING)]

    expect(summarize(doneToday, 'today', TUE_15_EVENING)).toMatchObject({ completed: 1, total: 1 })
  })
})

describe('summarize, what counts as done', () => {
  it('counts a task completed inside the period', () => {
    const tasks = [task(DAILY, TUE_15_EVENING)]

    expect(summarize(tasks, 'today', TUE_15)).toEqual({ completed: 1, total: 1, remaining: 0, percent: 100 })
  })

  it('leaves yesterday’s tick out of today', () => {
    const tasks = [task(DAILY, MON_14_EVENING)]

    expect(summarize(tasks, 'today', TUE_15)).toEqual({ completed: 0, total: 1, remaining: 1, percent: 0 })
  })

  it('still counts yesterday’s tick towards the week and the month it is in', () => {
    const tasks = [task(DAILY, MON_14_EVENING)]

    expect(summarize(tasks, 'week', TUE_15)).toEqual({ completed: 1, total: 1, remaining: 0, percent: 100 })
    expect(summarize(tasks, 'month', TUE_15)).toEqual({ completed: 1, total: 1, remaining: 0, percent: 100 })
  })

  it('counts a repeating task once per period, however many occurrences it had', () => {
    // Seven chances this week; one stored completion, so one tick. Counting the
    // other six needs a completion history, which does not exist yet.
    const tasks = [task(DAILY, TUE_15_EVENING)]

    expect(summarize(tasks, 'week', TUE_15).completed).toBe(1)
  })

  it('counts a task that happens once in the period it was completed in', () => {
    const tasks = [task(null, TUE_15_EVENING)]

    expect(summarize(tasks, 'today', TUE_15)).toEqual({ completed: 1, total: 1, remaining: 0, percent: 100 })
  })
})

describe('summarize, the numbers it reports', () => {
  it('reports how many are left and rounds the percentage down', () => {
    const tasks = [task(DAILY, TUE_15_EVENING), task(DAILY), task(DAILY)]

    expect(summarize(tasks, 'today', TUE_15)).toEqual({ completed: 1, total: 3, remaining: 2, percent: 33 })
  })

  it('never rounds up to a hundred while something is still to do', () => {
    const tasks = [task(DAILY, TUE_15_EVENING), task(DAILY, TUE_15_EVENING), task(DAILY)]

    expect(summarize(tasks, 'today', TUE_15).percent).toBe(66)
  })
})

describe('deleted tasks', () => {
  it('belong to no period, however they were counted before', () => {
    const live = task(DAILY)
    const binned = deleteTask(task(DAILY), TUE_15)

    for (const period of ['today', 'week', 'month'] as const) {
      expect(summarize([live, binned], period, TUE_15).total).toBe(1)
    }
  })

  it('take their completion out of the count with them', () => {
    const binned = deleteTask(task(DAILY, TUE_15), TUE_15_EVENING)

    expect(summarize([binned], 'today', TUE_15_EVENING)).toEqual({
      completed: 0,
      total: 0,
      remaining: 0,
      percent: 0,
    })
  })
})

describe('a task with a checklist', () => {
  const dueToday = () => setDueDate(task(null), '2026-09-15')

  it('counts once however many items it has, because the unit is the task', () => {
    const listed = ['crate it', 'label it', 'post it'].reduce(
      (current, title) => addSubtask(current, title, MON_14_EVENING),
      dueToday(),
    )

    expect(summarize([listed], 'today', TUE_15).total).toBe(1)
  })

  it('counts once when it is finished, not once per item ticked', () => {
    const listed = ['crate it', 'label it'].reduce(
      (current, title) => addSubtask(current, title, MON_14_EVENING),
      task(null),
    )
    const finished = listed.subtasks.reduce<Task>(
      (current, subtask) => setSubtaskDone(current, subtask.id, true, TUE_15),
      listed,
    )

    expect(summarize([finished], 'today', TUE_15)).toEqual({
      completed: 1,
      total: 1,
      remaining: 0,
      percent: 100,
    })
  })

  it('is still to do while an item is open, even with the rest ticked', () => {
    const listed = ['crate it', 'label it'].reduce(
      (current, title) => addSubtask(current, title, MON_14_EVENING),
      dueToday(),
    )
    const partly = setSubtaskDone(listed, listed.subtasks[0].id, true, TUE_15)

    expect(summarize([partly], 'today', TUE_15).completed).toBe(0)
  })
})

describe('summarize, a rule with a day to start on (DUE-18)', () => {
  it('asks nothing of the days before the rule starts', () => {
    const fromThursday = setStartDay(task(DAILY), '2026-09-17')

    expect(summarize([fromThursday], 'today', TUE_15).total).toBe(0)
    // Thursday is in this week, so the week still has its day to keep.
    expect(summarize([fromThursday], 'week', TUE_15).total).toBe(1)
  })

  it('counts as before once the start has gone by', () => {
    const fromMonday = setStartDay(task(DAILY), '2026-09-14')

    expect(summarize([fromMonday], 'today', TUE_15).total).toBe(1)
  })

  it('leaves a period out entirely when the rule starts after it', () => {
    const nextMonth = setStartDay(task(DAILY), '2026-10-01')

    expect(summarize([nextMonth], 'month', TUE_15).total).toBe(0)
  })
})

describe('summarize, with a skipped occurrence', () => {
  it('leaves a skipped day out of the count, and the rest of the period in (RPT-34)', () => {
    const skipped = skipOccurrence(task(DAILY), TUE_15)

    expect(summarize([skipped], 'today', TUE_15).total).toBe(0)
    expect(summarize([skipped], 'week', TUE_15).total).toBe(1)
  })

  it('leaves a week out whose only occurrence was skipped (RPT-34)', () => {
    const skipped = skipOccurrence(task(MONDAYS), TUE_15)

    expect(summarize([skipped], 'week', TUE_15).total).toBe(0)
  })

  it('counts it done once ticked off after all (RPT-36)', () => {
    const done = completeTask(skipOccurrence(task(DAILY), TUE_15), TUE_15_EVENING)

    expect(summarize([done], 'today', TUE_15_EVENING)).toMatchObject({ completed: 1, total: 1 })
  })
})
