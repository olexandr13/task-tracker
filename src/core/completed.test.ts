import { describe, expect, it } from 'vitest'
import { completionSpan, groupByCompletion, ROLLING_SPANS } from './completed'
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
