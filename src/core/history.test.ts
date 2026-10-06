import { describe, expect, it } from 'vitest'
import { historyStart, isHistory, isSpanHeld } from './history'
import { completeTask, createTask, deleteTask, setDueDate, type Task } from './task'

/* Done work left out of what the app loads as it opens. TASK ids refer to wiki/tasks.md,
   STORE ids to wiki/storage.md. */

// Local dates on purpose: the history counts local days. Friday 2 October 2026.
const NOW = new Date(2026, 9, 2, 9, 0)

/** A one-off finished at `at`. */
function doneAt(at: Date): Task {
  return completeTask(createTask('a task', null, new Date(2026, 0, 1)), at)
}

describe('historyStart', () => {
  it('is the first day of last week when that week began last month (STORE-55)', () => {
    // This week began on Monday 28 September, so last week on the 21st, before the month did.
    expect(historyStart(NOW)).toBe('2026-09-21')
  })

  it('is the first of the month once last week began inside it (STORE-55)', () => {
    // Last week began on Monday 5 October.
    expect(historyStart(new Date(2026, 9, 14, 9, 0))).toBe('2026-10-01')
  })

  it('is the day both began when they began together (STORE-55)', () => {
    expect(historyStart(new Date(2026, 5, 10, 9, 0))).toBe('2026-06-01')
  })

  it('holds the whole of last week on a Monday, for Weekly to count (STORE-55, CHST-10)', () => {
    // Monday 5 October: last week ran from Monday 28 September, before the month began.
    expect(historyStart(new Date(2026, 9, 5, 9, 0))).toBe('2026-09-28')
  })
})

describe('isHistory', () => {
  const START = '2026-09-28'

  it('is a one-off finished before the start and due before it, or never (STORE-55)', () => {
    expect(isHistory(doneAt(new Date(2026, 8, 27, 23, 59)), START)).toBe(true)
    expect(isHistory(setDueDate(doneAt(new Date(2026, 8, 20, 12, 0)), '2026-09-21'), START)).toBe(true)
  })

  it('leaves out work finished from the start on (STORE-55)', () => {
    expect(isHistory(doneAt(new Date(2026, 8, 28, 0, 1)), START)).toBe(false)
  })

  it('leaves out work finished early for a day from the start on, which that day still shows (LIST-4)', () => {
    expect(isHistory(setDueDate(doneAt(new Date(2026, 8, 20, 12, 0)), '2026-10-15'), START)).toBe(false)
  })

  it('leaves out what is still to do, what repeats and the trash (STORE-55)', () => {
    expect(isHistory(createTask('open', null, new Date(2026, 8, 1)), START)).toBe(false)
    expect(isHistory(completeTask(createTask('run', { kind: 'daily' }, new Date(2026, 8, 1)), new Date(2026, 8, 2)), START)).toBe(false)
    expect(isHistory(deleteTask(doneAt(new Date(2026, 8, 2)), new Date(2026, 8, 3)), START)).toBe(false)
  })

  it('counts a task marked done before anything said when as history (STORE-55)', () => {
    expect(isHistory({ ...doneAt(new Date(2026, 8, 2)), completedAt: null }, START)).toBe(true)
  })
})

describe('isSpanHeld', () => {
  it('holds a span starting on or after the day everything is held from (TASK-74)', () => {
    expect(isSpanHeld('today', '2026-09-28', NOW)).toBe(true)
    expect(isSpanHeld('yesterday', '2026-09-28', NOW)).toBe(true)
    // The last 7 days start on 26 September, two days before.
    expect(isSpanHeld('last7Days', '2026-09-28', NOW)).toBe(false)
    expect(isSpanHeld('last7Days', '2026-09-26', NOW)).toBe(true)
  })

  it('holds `earlier` only once everything is held (TASK-74)', () => {
    expect(isSpanHeld('earlier', '2020-01-01', NOW)).toBe(false)
    expect(isSpanHeld('earlier', null, NOW)).toBe(true)
  })
})
