import { describe, expect, it } from 'vitest'
import { InvalidDayError } from './day'
import { InvalidRepeatError, type Repeat } from './repeat'
import { EmptyTitleError } from './title'
import {
  DueDateOnRepeatingTaskError,
  completeTask,
  createTask,
  deleteTask,
  isComplete,
  isDeleted,
  hasDescription,
  isRepeating,
  renameTask,
  restoreTask,
  setDescription,
  setDueDate,
  setRepeat,
  uncompleteTask,
} from './task'

const NOW = new Date('2026-09-15T10:00:00.000Z')
const LATER = new Date('2026-09-15T18:30:00.000Z')

describe('createTask', () => {
  it('trims surrounding whitespace from the title', () => {
    expect(createTask('   buy milk  ').title).toBe('buy milk')
  })

  it('starts out with nothing written about it', () => {
    expect(createTask('buy milk', null, NOW).description).toBe('')
    expect(hasDescription(createTask('buy milk', null, NOW))).toBe(false)
  })

  it('starts out todo, with no completion time', () => {
    const task = createTask('buy milk', null, NOW)

    expect(task.status).toBe('todo')
    expect(task.completedAt).toBeNull()
    expect(task.deletedAt).toBeNull()
    expect(task.subtasks).toEqual([])
    expect(task.createdAt).toBe(NOW.toISOString())
  })

  it('rejects a title that is blank or only whitespace', () => {
    expect(() => createTask('   ')).toThrow(EmptyTitleError)
  })

  it('gives every task its own id', () => {
    expect(createTask('a').id).not.toBe(createTask('a').id)
  })
})

describe('renameTask', () => {
  it('changes the title and trims it', () => {
    const task = renameTask(createTask('buy milk', null, NOW), '  buy oat milk  ')

    expect(task.title).toBe('buy oat milk')
  })

  it('keeps everything else, so a rename is not a new task', () => {
    const done = completeTask(createTask('push-ups', { kind: 'daily' }, NOW), LATER)
    const renamed = renameTask(done, 'sit-ups')

    expect(renamed.id).toBe(done.id)
    expect(renamed.createdAt).toBe(done.createdAt)
    expect(renamed.completedAt).toBe(done.completedAt)
    expect(renamed.status).toBe('done')
    expect(renamed.repeat).toEqual(done.repeat)
  })

  it('rejects a title that is blank or only whitespace', () => {
    expect(() => renameTask(createTask('buy milk', null, NOW), '   ')).toThrow(EmptyTitleError)
  })

  it('leaves the original task untouched', () => {
    const task = createTask('buy milk', null, NOW)
    renameTask(task, 'buy oat milk')

    expect(task.title).toBe('buy milk')
  })

  it('keeps the task as it is when the title has not changed', () => {
    const task = createTask('buy milk', null, NOW)

    expect(renameTask(task, '  buy milk ')).toBe(task)
  })
})

describe('setDescription', () => {
  it('writes the description, trimmed at the ends', () => {
    const task = setDescription(createTask('buy milk', null, NOW), '  oat, not soy \n')

    expect(task.description).toBe('oat, not soy')
    expect(hasDescription(task)).toBe(true)
  })

  it('keeps the blank lines inside, which are part of what was written', () => {
    const task = setDescription(createTask('shopping', null, NOW), 'first aisle\n\nthen the till')

    expect(task.description).toBe('first aisle\n\nthen the till')
  })

  it('clears the description when given nothing, which is a fair thing to want', () => {
    const written = setDescription(createTask('buy milk', null, NOW), 'oat, not soy')
    const cleared = setDescription(written, '   ')

    expect(cleared.description).toBe('')
    expect(hasDescription(cleared)).toBe(false)
  })

  it('keeps everything else, so writing about a task does not make it another one', () => {
    const done = completeTask(createTask('push-ups', { kind: 'daily' }, NOW), LATER)
    const described = setDescription(done, 'three sets of twelve')

    expect(described.id).toBe(done.id)
    expect(described.title).toBe(done.title)
    expect(described.createdAt).toBe(done.createdAt)
    expect(described.completedAt).toBe(done.completedAt)
    expect(described.status).toBe('done')
    expect(described.repeat).toEqual(done.repeat)
    expect(isComplete(described, LATER)).toBe(true)
  })

  it('hands back the same task when the description has not changed', () => {
    const task = setDescription(createTask('buy milk', null, NOW), 'oat, not soy')

    expect(setDescription(task, '  oat, not soy  ')).toBe(task)
  })

  it('never modifies the task it is given', () => {
    const task = createTask('buy milk', null, NOW)
    setDescription(task, 'oat, not soy')

    expect(task.description).toBe('')
  })
})

describe('completeTask', () => {
  it('marks the task done and stamps the time', () => {
    const done = completeTask(createTask('buy milk', null, NOW), LATER)

    expect(done.status).toBe('done')
    expect(done.completedAt).toBe(LATER.toISOString())
    expect(isComplete(done)).toBe(true)
  })

  it('leaves the original task untouched', () => {
    const task = createTask('buy milk', null, NOW)
    completeTask(task, LATER)

    expect(task.status).toBe('todo')
    expect(task.completedAt).toBeNull()
  })

  it('keeps the first completion time when completed twice', () => {
    const done = completeTask(createTask('buy milk', null, NOW), LATER)

    expect(completeTask(done, new Date('2026-09-16T09:00:00.000Z'))).toBe(done)
  })
})

describe('uncompleteTask', () => {
  it('puts the task back to todo and forgets the completion time', () => {
    const task = uncompleteTask(completeTask(createTask('buy milk', null, NOW), LATER))

    expect(task.status).toBe('todo')
    expect(task.completedAt).toBeNull()
    expect(isComplete(task)).toBe(false)
  })

  it('leaves the original task untouched', () => {
    const done = completeTask(createTask('buy milk', null, NOW), LATER)
    uncompleteTask(done)

    expect(done.status).toBe('done')
    expect(done.completedAt).toBe(LATER.toISOString())
  })

  it('keeps a task that is already todo as it is', () => {
    const task = createTask('buy milk', null, NOW)

    expect(uncompleteTask(task)).toBe(task)
  })
})

// Local dates, because occurrences are local days: Mon 14, Tue 15, Wed 16 September 2026.
const MON_14 = new Date(2026, 8, 14, 9, 0)
const TUE_15 = new Date(2026, 8, 15, 9, 0)
const WED_16 = new Date(2026, 8, 16, 9, 0)

const DAILY: Repeat = { kind: 'daily' }
const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }

describe('repeating tasks', () => {
  it('keeps the rule it was created with', () => {
    const task = createTask('push-ups', DAILY, NOW)

    expect(task.repeat).toEqual(DAILY)
    expect(isRepeating(task)).toBe(true)
    expect(isRepeating(createTask('buy milk', null, NOW))).toBe(false)
  })

  it('refuses a rule that would never come round', () => {
    expect(() => createTask('push-ups', { kind: 'weekly', weekdays: [] }, NOW)).toThrow(InvalidRepeatError)
  })

  it('reads as done for the rest of the day it was completed on', () => {
    const done = completeTask(createTask('push-ups', DAILY, MON_14), MON_14)

    expect(isComplete(done, MON_14)).toBe(true)
    expect(isComplete(done, new Date(2026, 8, 14, 23, 30))).toBe(true)
  })

  it('reads as todo again the next day, without anything rewriting it', () => {
    const done = completeTask(createTask('push-ups', DAILY, MON_14), MON_14)

    expect(isComplete(done, TUE_15)).toBe(false)
    // The record of yesterday's completion is still there; only the reading changed.
    expect(done.completedAt).toBe(MON_14.toISOString())
  })

  it('can be completed again on the next occurrence', () => {
    const yesterday = completeTask(createTask('push-ups', DAILY, MON_14), MON_14)
    const today = completeTask(yesterday, TUE_15)

    expect(today).not.toBe(yesterday)
    expect(today.completedAt).toBe(TUE_15.toISOString())
    expect(isComplete(today, TUE_15)).toBe(true)
  })

  it('stays done between occurrences of a weekly rule', () => {
    const done = completeTask(createTask('water plants', MONDAYS, MON_14), MON_14)

    expect(isComplete(done, TUE_15)).toBe(true)
    expect(isComplete(done, WED_16)).toBe(true)
    expect(isComplete(done, new Date(2026, 8, 21, 9, 0))).toBe(false)
  })

  it('undoes only the occurrence in play', () => {
    const done = completeTask(createTask('push-ups', DAILY, MON_14), MON_14)

    expect(uncompleteTask(done, MON_14).completedAt).toBeNull()
    // A day later it already reads as todo, so there is nothing to undo.
    expect(uncompleteTask(done, TUE_15)).toBe(done)
  })
})

describe('setRepeat', () => {
  it('gives a rule to a task that did not have one', () => {
    const task = setRepeat(createTask('push-ups', null, MON_14), DAILY, MON_14)

    expect(task.repeat).toEqual(DAILY)
  })

  it('swaps one rule for another', () => {
    const task = setRepeat(createTask('water plants', DAILY, MON_14), MONDAYS, MON_14)

    expect(task.repeat).toEqual(MONDAYS)
  })

  it('refuses a rule that would never come round', () => {
    expect(() => setRepeat(createTask('push-ups', null, MON_14), { kind: 'weekly', weekdays: [] }, MON_14)).toThrow(
      InvalidRepeatError,
    )
  })

  it('keeps today\'s completion when a finished one-off starts repeating', () => {
    const done = completeTask(createTask('push-ups', null, MON_14), MON_14)
    const daily = setRepeat(done, DAILY, MON_14)

    expect(isComplete(daily, MON_14)).toBe(true)
    expect(isComplete(daily, TUE_15)).toBe(false)
  })

  it('does not resurrect a stale completion when a repeating task stops repeating', () => {
    // Completed yesterday, so it already reads as todo again today. Turning it
    // into a one-off must not make yesterday's tick count as finished.
    const done = completeTask(createTask('push-ups', DAILY, MON_14), MON_14)
    const once = setRepeat(done, null, TUE_15)

    expect(isComplete(once, TUE_15)).toBe(false)
    expect(once.completedAt).toBeNull()
  })

  it('keeps a completion that is still standing when a task stops repeating', () => {
    const done = completeTask(createTask('push-ups', DAILY, MON_14), MON_14)
    const once = setRepeat(done, null, MON_14)

    expect(isComplete(once, MON_14)).toBe(true)
    expect(once.completedAt).toBe(MON_14.toISOString())
  })

  it('leaves the original task untouched', () => {
    const task = createTask('push-ups', null, MON_14)
    setRepeat(task, DAILY, MON_14)

    expect(task.repeat).toBeNull()
  })
})

describe('setDueDate', () => {
  it('starts a task with no day, and gives it one, moves it and takes it away', () => {
    const task = createTask('file taxes', null, NOW)
    expect(task.dueDate).toBeNull()

    const dated = setDueDate(task, '2026-09-20')
    expect(dated.dueDate).toBe('2026-09-20')
    expect(setDueDate(dated, '2026-09-21').dueDate).toBe('2026-09-21')
    expect(setDueDate(dated, null).dueDate).toBeNull()
  })

  it('changes the day and nothing else, so moving it never undoes a tick', () => {
    const done = completeTask(createTask('file taxes', null, NOW), LATER)
    const moved = setDueDate(done, '2026-09-30')

    expect({ ...moved, dueDate: null }).toEqual(done)
    expect(isComplete(moved, LATER)).toBe(true)
  })

  it('hands back the same task when the day is already the one set', () => {
    const dated = setDueDate(createTask('file taxes', null, NOW), '2026-09-20')

    expect(setDueDate(dated, '2026-09-20')).toBe(dated)
  })

  it('refuses something that is not a calendar day', () => {
    const task = createTask('file taxes', null, NOW)

    expect(() => setDueDate(task, '2026-02-30')).toThrow(InvalidDayError)
    expect(() => setDueDate(task, 'tomorrow')).toThrow(InvalidDayError)
  })

  it('refuses a day on a repeating task, whose rule already says when it is due', () => {
    const daily = createTask('stretch', { kind: 'daily' }, NOW)

    expect(() => setDueDate(daily, '2026-09-20')).toThrow(DueDateOnRepeatingTaskError)
    expect(setDueDate(daily, null)).toBe(daily)
  })

  it('is cleared by giving the task a rule, which decides its days from then on', () => {
    const dated = setDueDate(createTask('stretch', null, NOW), '2026-09-20')

    expect(setRepeat(dated, { kind: 'daily' }, NOW).dueDate).toBeNull()
  })
})

describe('deleteTask', () => {
  it('stamps when the task went to the trash', () => {
    const deleted = deleteTask(createTask('buy milk', null, NOW), LATER)

    expect(deleted.deletedAt).toBe(LATER.toISOString())
    expect(isDeleted(deleted)).toBe(true)
  })

  it('leaves a task that is already in the trash exactly as it was', () => {
    const deleted = deleteTask(createTask('buy milk', null, NOW), NOW)

    expect(deleteTask(deleted, LATER)).toBe(deleted)
  })

  it('keeps the completion record, so restoring gives back the same task', () => {
    const done = completeTask(createTask('push-ups', DAILY, NOW), NOW)
    const deleted = deleteTask(done, LATER)

    expect(deleted.status).toBe('done')
    expect(deleted.completedAt).toBe(NOW.toISOString())
    expect(isComplete(restoreTask(deleted), NOW)).toBe(true)
  })

  it('leaves the original task untouched', () => {
    const task = createTask('buy milk', null, NOW)
    deleteTask(task, LATER)

    expect(task.deletedAt).toBeNull()
  })
})

describe('restoreTask', () => {
  it('takes the task back out of the trash', () => {
    const restored = restoreTask(deleteTask(createTask('buy milk', null, NOW), LATER))

    expect(restored.deletedAt).toBeNull()
    expect(isDeleted(restored)).toBe(false)
  })

  it('leaves a task that is not in the trash exactly as it was', () => {
    const task = createTask('buy milk', null, NOW)

    expect(restoreTask(task)).toBe(task)
  })
})
