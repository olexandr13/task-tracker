import { describe, expect, it } from 'vitest'
import { completionSpan, groupByCompletion, MONTH_SPANS, ROLLING_SPANS, WEEK_SPANS } from './completed'
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

describe('calendar spans', () => {
  // Saturday 19 September 2026: this week began on Monday the 14th.
  it('divides a week by the calendar week, from Monday (TASK-59)', () => {
    expect(completionSpan(doneAt(new Date(2026, 8, 19, 8, 0)), WEEK_SPANS, NOW)).toBe('today')
    expect(completionSpan(doneAt(new Date(2026, 8, 18, 8, 0)), WEEK_SPANS, NOW)).toBe('yesterday')
    expect(completionSpan(doneAt(new Date(2026, 8, 14, 0, 5)), WEEK_SPANS, NOW)).toBe('thisWeek')
    expect(completionSpan(doneAt(new Date(2026, 8, 13, 23, 55)), WEEK_SPANS, NOW)).toBe('earlier')
  })

  it('divides a month by the calendar month, from the 1st (TASK-59)', () => {
    expect(completionSpan(doneAt(new Date(2026, 8, 15, 8, 0)), MONTH_SPANS, NOW)).toBe('thisWeek')
    expect(completionSpan(doneAt(new Date(2026, 8, 13, 8, 0)), MONTH_SPANS, NOW)).toBe('thisMonth')
    expect(completionSpan(doneAt(new Date(2026, 8, 1, 0, 5)), MONTH_SPANS, NOW)).toBe('thisMonth')
    expect(completionSpan(doneAt(new Date(2026, 7, 31, 23, 55)), MONTH_SPANS, NOW)).toBe('earlier')
  })

  it('leaves this week empty until Wednesday, yesterday being Sunday on a Monday (TASK-59)', () => {
    const monday = new Date(2026, 8, 21, 9, 0)
    const tuesday = new Date(2026, 8, 22, 9, 0)

    expect(completionSpan(doneAt(new Date(2026, 8, 20, 8, 0)), WEEK_SPANS, monday)).toBe('yesterday')
    expect(completionSpan(doneAt(new Date(2026, 8, 19, 8, 0)), WEEK_SPANS, monday)).toBe('earlier')
    expect(completionSpan(doneAt(new Date(2026, 8, 21, 8, 0)), WEEK_SPANS, tuesday)).toBe('yesterday')
  })

  it('counts a week that began last month as this week in a month (TASK-59)', () => {
    // Thursday 1 October 2026: this week began on Monday 28 September.
    const firstOfMonth = new Date(2026, 9, 1, 9, 0)

    expect(completionSpan(doneAt(new Date(2026, 8, 29, 8, 0)), MONTH_SPANS, firstOfMonth)).toBe('thisWeek')
    expect(completionSpan(doneAt(new Date(2026, 8, 27, 8, 0)), MONTH_SPANS, firstOfMonth)).toBe('earlier')
  })
})

describe('groupByCompletion', () => {
  it('puts the tasks to do first, then each span that holds any, most recent first', () => {
    const open = createTask('open', null, NOW)
    const old = doneAt(new Date(2026, 7, 1, 8, 0))
    const monday = doneAt(new Date(2026, 8, 14, 8, 0))
    const today = doneAt(new Date(2026, 8, 19, 8, 0))

    expect(groupByCompletion([old, monday, open, today], WEEK_SPANS, NOW)).toEqual([
      { span: null, tasks: [open] },
      { span: 'today', tasks: [today] },
      { span: 'thisWeek', tasks: [monday] },
      { span: 'earlier', tasks: [old] },
    ])
  })
})
