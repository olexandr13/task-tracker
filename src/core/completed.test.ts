import { describe, expect, it } from 'vitest'
import {
  completionSpan,
  doneWork,
  groupByCompletion,
  pastCompletions,
  pastCompletionsBySpan,
  ROLLING_SPANS,
} from './completed'
import { completeTask, createTask, type Task } from './task'

/* Which span a done task falls in. TASK ids refer to wiki/tasks.md. */

// Local dates on purpose: the spans count local days. Saturday 19 September 2026.
const NOW = new Date(2026, 8, 19, 9, 0)

/** A one-off finished at `at`. */
function doneAt(at: Date): Task {
  return completeTask(createTask('a task', null, new Date(2026, 0, 1)), at)
}

describe('completionSpan', () => {
  it('is null for a task still to do', () => {
    expect(completionSpan(createTask('a task', null, NOW), ROLLING_SPANS, NOW)).toBeNull()
  })

  it('divides done tasks by the local day they were finished on (TASK-56)', () => {
    expect(completionSpan(doneAt(new Date(2026, 8, 19, 0, 5)), ROLLING_SPANS, NOW)).toBe('today')
    expect(completionSpan(doneAt(new Date(2026, 8, 18, 23, 55)), ROLLING_SPANS, NOW)).toBe('yesterday')
    expect(completionSpan(doneAt(new Date(2026, 8, 17, 12, 0)), ROLLING_SPANS, NOW)).toBe('last7Days')
    expect(completionSpan(doneAt(new Date(2026, 8, 13, 12, 0)), ROLLING_SPANS, NOW)).toBe('last7Days')
    expect(completionSpan(doneAt(new Date(2026, 8, 12, 12, 0)), ROLLING_SPANS, NOW)).toBe('last30Days')
    expect(completionSpan(doneAt(new Date(2026, 7, 21, 12, 0)), ROLLING_SPANS, NOW)).toBe('last30Days')
    expect(completionSpan(doneAt(new Date(2026, 7, 20, 12, 0)), ROLLING_SPANS, NOW)).toBe('earlier')
  })

  it('moves yesterday’s work along once the day turns, with nothing rewritten (TASK-56)', () => {
    const task = doneAt(new Date(2026, 8, 19, 8, 0))

    expect(completionSpan(task, ROLLING_SPANS, new Date(2026, 8, 19, 23, 59))).toBe('today')
    expect(completionSpan(task, ROLLING_SPANS, new Date(2026, 8, 20, 0, 1))).toBe('yesterday')
  })

  it('counts a day in the first span reaching back to it, where a set leaves a span out (TASK-72)', () => {
    const spans = ['today', 'last7Days', 'last30Days'] as const

    expect(completionSpan(doneAt(new Date(2026, 8, 18, 23, 55)), spans, NOW)).toBe('last7Days')
    expect(completionSpan(doneAt(new Date(2026, 8, 19, 0, 5)), spans, NOW)).toBe('today')
    expect(completionSpan(doneAt(new Date(2026, 7, 20, 12, 0)), spans, NOW)).toBe('earlier')
  })

  it('counts a completion stamped ahead of today as today’s', () => {
    expect(completionSpan(doneAt(new Date(2026, 8, 20, 12, 0)), ROLLING_SPANS, NOW)).toBe('today')
  })

  it('goes by the occurrence in play for a repeating task', () => {
    const daily = completeTask(createTask('a habit', { kind: 'daily' }, new Date(2026, 8, 1)), new Date(2026, 8, 18, 9, 0))
    const weekly = completeTask(
      createTask('a chore', { kind: 'weekly', weekdays: [4] }, new Date(2026, 8, 1)),
      new Date(2026, 8, 17, 9, 0),
    )

    // Yesterday's tick is last occurrence's: today the habit is to do again.
    expect(completionSpan(daily, ROLLING_SPANS, NOW)).toBeNull()
    // Thursday's tick still covers the week, until next Thursday.
    expect(completionSpan(weekly, ROLLING_SPANS, NOW)).toBe('last7Days')
  })
})

describe('groupByCompletion', () => {
  it('puts the tasks to do first, then each span that holds any, most recent first', () => {
    const open = createTask('open', null, NOW)
    const old = doneAt(new Date(2026, 7, 1, 8, 0))
    const lastWeek = doneAt(new Date(2026, 8, 14, 8, 0))
    const today = doneAt(new Date(2026, 8, 19, 8, 0))

    expect(groupByCompletion([old, lastWeek, open, today], ROLLING_SPANS, NOW)).toEqual([
      { span: null, tasks: [open] },
      { span: 'today', tasks: [today] },
      { span: 'last7Days', tasks: [lastWeek] },
      { span: 'earlier', tasks: [old] },
    ])
  })
})

/** A repeating task ticked off at each moment in turn, each in an occurrence of its own. */
function doneOn(repeat: Task['repeat'], ...moments: Date[]): Task {
  return moments.reduce((task, at) => completeTask(task, at), createTask('a habit', repeat, new Date(2026, 8, 1)))
}

describe('pastCompletions', () => {
  it('is every day a habit was done on before today, latest first, while today is still to do (TASK-75)', () => {
    const habit = doneOn({ kind: 'daily' }, new Date(2026, 8, 10, 9, 0), new Date(2026, 8, 17, 9, 0), new Date(2026, 8, 18, 21, 0))

    expect(pastCompletions(habit, NOW).map((past) => past.day)).toEqual(['2026-09-18', '2026-09-17', '2026-09-10'])
    expect(pastCompletions(habit, NOW).every((past) => past.task === habit)).toBe(true)
  })

  it('leaves out the day the task reads as done for, which its own row stands for', () => {
    const habit = doneOn({ kind: 'daily' }, new Date(2026, 8, 18, 9, 0), new Date(2026, 8, 19, 8, 0))
    // Thursday's tick still covers the week; the Thursday before is gone by.
    const weekly = doneOn({ kind: 'weekly', weekdays: [4] }, new Date(2026, 8, 10, 9, 0), new Date(2026, 8, 17, 9, 0))

    expect(pastCompletions(habit, NOW).map((past) => past.day)).toEqual(['2026-09-18'])
    expect(pastCompletions(weekly, NOW).map((past) => past.day)).toEqual(['2026-09-10'])
  })

  it('leaves out a day after today, which a clock running ahead wrote', () => {
    const habit = doneOn({ kind: 'daily' }, new Date(2026, 8, 18, 9, 0))

    expect(pastCompletions({ ...habit, doneDays: [...habit.doneDays, '2026-09-21'] }, NOW).map((past) => past.day)).toEqual([
      '2026-09-18',
    ])
  })

  it('is nothing for a one-off, or for a task in the trash', () => {
    const habit = doneOn({ kind: 'daily' }, new Date(2026, 8, 18, 9, 0))

    expect(pastCompletions(doneAt(new Date(2026, 8, 18, 9, 0)), NOW)).toEqual([])
    // A rule dropped keeps its days (RPT-30), but the task is one record again.
    expect(pastCompletions({ ...habit, repeat: null }, NOW)).toEqual([])
    expect(pastCompletions({ ...habit, deletedAt: NOW.toISOString() }, NOW)).toEqual([])
  })
})

describe('pastCompletionsBySpan', () => {
  it('divides the days among the spans, latest first, a day keeping the order of the tasks', () => {
    const teeth = doneOn({ kind: 'daily' }, new Date(2026, 8, 1, 9, 0), new Date(2026, 8, 15, 9, 0), new Date(2026, 8, 18, 9, 0))
    const games = doneOn({ kind: 'daily' }, new Date(2026, 8, 16, 9, 0), new Date(2026, 8, 18, 9, 0))

    const bySpan = pastCompletionsBySpan([teeth, games], ROLLING_SPANS, NOW)

    expect(bySpan.get('today')).toBeUndefined()
    expect(bySpan.get('yesterday')).toEqual([
      { task: teeth, day: '2026-09-18' },
      { task: games, day: '2026-09-18' },
    ])
    expect(bySpan.get('last7Days')).toEqual([
      { task: games, day: '2026-09-16' },
      { task: teeth, day: '2026-09-15' },
    ])
    expect(bySpan.get('earlier')).toBeUndefined()
    expect(bySpan.get('last30Days')).toEqual([{ task: teeth, day: '2026-09-01' }])
  })
})

describe('doneWork', () => {
  it('runs the done tasks and the past days together, latest first (TASK-70)', () => {
    const habit = doneOn({ kind: 'daily' }, new Date(2026, 8, 15, 9, 0), new Date(2026, 8, 17, 9, 0))
    const late = doneAt(new Date(2026, 8, 17, 20, 0))
    const earlier = doneAt(new Date(2026, 8, 16, 12, 0))
    const unstamped = { ...doneAt(new Date(2026, 8, 16, 12, 0)), completedAt: null }
    const [day17, day15] = pastCompletions(habit, NOW)

    expect(doneWork([late, earlier, unstamped], [day17, day15])).toEqual([
      // A past day counts from its start, so the work finished later that day leads it.
      { task: late, day: null },
      day17,
      { task: earlier, day: null },
      day15,
      { task: unstamped, day: null },
    ])
  })

  it('is the done tasks alone with no past days, and the days alone with no tasks', () => {
    const task = doneAt(new Date(2026, 8, 17, 20, 0))
    const past = pastCompletions(doneOn({ kind: 'daily' }, new Date(2026, 8, 15, 9, 0)), NOW)

    expect(doneWork([task], [])).toEqual([{ task, day: null }])
    expect(doneWork([], past)).toEqual(past)
  })
})
