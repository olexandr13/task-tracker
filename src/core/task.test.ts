import { describe, expect, it } from 'vitest'
import { InvalidDayError, InvalidTimeOfDayError, toLocalDay } from './day'
import { InvalidRepeatError, type Repeat } from './repeat'
import { setReward } from './reward'
import { setUrgent } from './urgent'
import { addTag } from './tag'
import { EmptyTitleError } from './title'
import {
  DueDateOnRepeatingTaskError,
  DueTimeWithoutDayError,
  StartDayOnOneOffError,
  addSubtask,
  completeTask,
  createTask,
  deleteTask,
  duplicateTask,
  isComplete,
  isDeleted,
  hasDescription,
  isRepeating,
  renameTask,
  restoreTask,
  hasDueDay,
  scheduleOn,
  scheduledDay,
  setDescription,
  setDueDate,
  setDueTime,
  setRepeat,
  setStartDay,
  setSubtaskDone,
  startedOn,
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

  it('earns no points until it is given a reward (RWD-1)', () => {
    expect(createTask('buy milk', { kind: 'daily' }, NOW).reward).toBeNull()
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

describe('setStartDay', () => {
  it('says which day a repeating task\'s rule starts on, and leaves the rule alone', () => {
    const daily = createTask('stretch', { kind: 'daily' }, NOW)
    const started = setStartDay(daily, '2026-09-20')

    expect(started.startDay).toBe('2026-09-20')
    expect(started.repeat).toEqual({ kind: 'daily' })
    expect(started.dueDate).toBeNull()
  })

  it('moves the day, and lets it go with null', () => {
    const daily = setStartDay(createTask('stretch', { kind: 'daily' }, NOW), '2026-09-20')

    expect(setStartDay(daily, '2026-09-21').startDay).toBe('2026-09-21')
    expect(setStartDay(daily, null).startDay).toBeNull()
  })

  it('refuses a day that is not a day', () => {
    const daily = createTask('stretch', { kind: 'daily' }, NOW)

    expect(() => setStartDay(daily, '2026-02-30')).toThrow(InvalidDayError)
    expect(() => setStartDay(daily, 'monday')).toThrow(InvalidDayError)
  })

  it('refuses a start on a one-off, which is due on a date of its own', () => {
    const task = createTask('file taxes', null, NOW)

    expect(() => setStartDay(task, '2026-09-20')).toThrow(StartDayOnOneOffError)
    expect(setStartDay(task, null)).toBe(task)
  })

  it('is let go of with the rule, and kept when one rule is swapped for another', () => {
    const daily = setStartDay(createTask('stretch', { kind: 'daily' }, NOW), '2026-09-20')

    expect(setRepeat(daily, null, LATER).startDay).toBeNull()
    expect(setRepeat(daily, { kind: 'weekly', weekdays: [1] }, LATER).startDay).toBe('2026-09-20')
  })
})

describe('scheduleOn', () => {
  it('gives a one-off its date, and a repeating task the day its rule starts on', () => {
    const task = createTask('file taxes', null, NOW)
    const daily = createTask('stretch', { kind: 'daily' }, NOW)

    expect(scheduleOn(task, '2026-09-20')).toEqual(setDueDate(task, '2026-09-20'))
    expect(scheduleOn(daily, '2026-09-20')).toEqual(setStartDay(daily, '2026-09-20'))
    // The rule is untouched: a date picked no longer ends it.
    expect(scheduleOn(daily, '2026-09-20').repeat).toEqual({ kind: 'daily' })
  })

  it('takes the day away with null, whichever day the task carried', () => {
    const dated = setDueDate(createTask('file taxes', null, NOW), '2026-09-20')
    const started = setStartDay(createTask('stretch', { kind: 'daily' }, NOW), '2026-09-20')

    expect(scheduleOn(dated, null).dueDate).toBeNull()
    expect(scheduleOn(started, null).startDay).toBeNull()
  })
})

describe('setDueTime', () => {
  const dated = setDueDate(createTask('file taxes', null, NOW), '2026-09-20')
  const daily = createTask('stretch', { kind: 'daily' }, NOW)

  it('starts a task with no hour, and gives it one, moves it and takes it away', () => {
    expect(dated.dueTime).toBeNull()

    const nine = setDueTime(dated, '09:00')
    expect(nine.dueTime).toBe('09:00')
    expect(setDueTime(nine, '18:30').dueTime).toBe('18:30')
    expect(setDueTime(nine, null).dueTime).toBeNull()
  })

  it('leaves the day where it is: an hour is not a second way to move a date', () => {
    const nine = setDueTime(dated, '09:00')

    expect(nine.dueDate).toBe('2026-09-20')
    expect({ ...nine, dueTime: null }).toEqual(dated)
  })

  it('gives a repeating task the hour every one of its occurrences is due at', () => {
    const nine = setDueTime(daily, '09:00')

    expect(nine.dueTime).toBe('09:00')
    expect(nine.repeat).toEqual({ kind: 'daily' })
  })

  it('hands back the same task when the hour is already the one set', () => {
    const nine = setDueTime(dated, '09:00')

    expect(setDueTime(nine, '09:00')).toBe(nine)
  })

  it('refuses something that is not a time of day', () => {
    expect(() => setDueTime(dated, '24:00')).toThrow(InvalidTimeOfDayError)
    expect(() => setDueTime(dated, '9am')).toThrow(InvalidTimeOfDayError)
  })

  it('refuses an hour on a task with no day for it to fall on', () => {
    const undated = createTask('file taxes', null, NOW)

    expect(() => setDueTime(undated, '09:00')).toThrow(DueTimeWithoutDayError)
    // Taking away an hour there is none of is nothing to refuse.
    expect(setDueTime(undated, null)).toBe(undated)
  })

  it('leaves with the date it hung on, rather than waiting for the next one', () => {
    const nine = setDueTime(dated, '09:00')
    const cleared = setDueDate(nine, null)

    expect(cleared.dueTime).toBeNull()
    expect(setDueDate(cleared, '2026-09-21').dueTime).toBeNull()
  })

  it('leaves with the rule that was giving a repeating task its days', () => {
    const nine = setDueTime(daily, '09:00')

    expect(setRepeat(nine, null, LATER).dueTime).toBeNull()
  })

  it('stays when a dated task is made to repeat, the rule giving it days instead', () => {
    const nine = setDueTime(dated, '09:00')
    const repeating = setRepeat(nine, { kind: 'daily' }, NOW)

    expect(repeating.dueDate).toBeNull()
    expect(repeating.dueTime).toBe('09:00')
  })

  it('stays when one rule is swapped for another', () => {
    const nine = setDueTime(daily, '09:00')

    expect(setRepeat(nine, { kind: 'weekly', weekdays: [1] }, LATER).dueTime).toBe('09:00')
  })
})

describe('hasDueDay', () => {
  it('is true of a task with a date, and of one whose rule gives it days', () => {
    expect(hasDueDay(createTask('file taxes', null, NOW))).toBe(false)
    expect(hasDueDay(setDueDate(createTask('file taxes', null, NOW), '2026-09-20'))).toBe(true)
    expect(hasDueDay(createTask('stretch', { kind: 'daily' }, NOW))).toBe(true)
  })
})

describe('scheduledDay', () => {
  it('is the day the task carries itself: a one-off\'s date, a repeating task\'s start', () => {
    const dated = setDueDate(createTask('file taxes', null, NOW), '2026-09-20')
    const daily = createTask('stretch', { kind: 'daily' }, NOW)

    expect(scheduledDay(dated)).toBe('2026-09-20')
    expect(scheduledDay(daily)).toBeNull()
    expect(scheduledDay(setStartDay(daily, '2026-09-20'))).toBe('2026-09-20')
  })
})

describe('startedOn', () => {
  it('is the day chosen for the rule, or the day the task was written', () => {
    const daily = createTask('stretch', { kind: 'daily' }, NOW)

    expect(startedOn(daily)).toBe(toLocalDay(NOW))
    expect(startedOn(setStartDay(daily, '2026-09-20'))).toBe('2026-09-20')
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

// Local dates again: a history is made of local days.
const TUE_15_NIGHT = new Date(2026, 8, 15, 23, 59)
const THU_17 = new Date(2026, 8, 17, 9, 0)

describe('doneDays', () => {
  it('records the day a repeating task is done on, oldest first', () => {
    const task = completeTask(completeTask(createTask('stretch', DAILY, MON_14), MON_14), TUE_15_NIGHT)

    expect(task.doneDays).toEqual(['2026-09-14', '2026-09-15'])
  })

  it('records a day once, however many times it is ticked on it', () => {
    const task = createTask('stretch', DAILY, MON_14)
    const again = completeTask(uncompleteTask(completeTask(task, MON_14), MON_14), MON_14)

    expect(again.doneDays).toEqual(['2026-09-14'])
  })

  it('takes the day back when the tick is taken back, leaving the days before it', () => {
    const done = completeTask(completeTask(createTask('stretch', DAILY, MON_14), MON_14), TUE_15)

    expect(uncompleteTask(done, TUE_15).doneDays).toEqual(['2026-09-14'])
  })

  it('takes back a weekly tick made after its day, for the occurrence it counted towards', () => {
    const done = completeTask(createTask('review', MONDAYS, MON_14), TUE_15)

    expect(done.doneDays).toEqual(['2026-09-15'])
    expect(uncompleteTask(done, WED_16).doneDays).toEqual([])
  })

  it('keeps no history for a task that happens once', () => {
    expect(completeTask(createTask('buy milk', null, NOW), LATER).doneDays).toEqual([])
  })

  it('follows a checklist that finishes the task, and reopens it', () => {
    const task = addSubtask(createTask('morning routine', DAILY, MON_14), 'stretch', MON_14)
    const itemId = task.subtasks[0].id
    const finished = setSubtaskDone(task, itemId, true, TUE_15)

    expect(finished.doneDays).toEqual(['2026-09-15'])
    expect(setSubtaskDone(finished, itemId, false, TUE_15).doneDays).toEqual([])
  })

  it('counts a one-off finished today once it becomes a habit (RPT-13)', () => {
    const task = setRepeat(completeTask(createTask('stretch', null, MON_14), TUE_15), DAILY, TUE_15)

    expect(task.doneDays).toEqual(['2026-09-15'])
  })

  it('keeps the history when the rule is dropped, and picks it back up when a rule returns', () => {
    const habit = completeTask(createTask('stretch', DAILY, MON_14), MON_14)
    const dropped = setRepeat(habit, null, WED_16)

    expect(dropped.doneDays).toEqual(['2026-09-14'])
    expect(setRepeat(dropped, DAILY, THU_17).doneDays).toEqual(['2026-09-14'])
  })

  it('forgets today when a rule returns to a task that was reopened while it happened once', () => {
    const doneToday = completeTask(createTask('stretch', DAILY, MON_14), TUE_15)
    const reopened = uncompleteTask(setRepeat(doneToday, null, TUE_15), TUE_15)

    expect(setRepeat(reopened, DAILY, TUE_15).doneDays).toEqual([])
  })

  it('never touches the task it was given', () => {
    const task = completeTask(createTask('stretch', DAILY, MON_14), MON_14)
    completeTask(task, TUE_15)

    expect(task.doneDays).toEqual(['2026-09-14'])
  })
})

describe('reopening a missed occurrence', () => {
  it('passes the occurrence over when the tick is taken back after its day (RPT-38)', () => {
    const done = completeTask(createTask('review', MONDAYS, MON_14), WED_16)

    expect(uncompleteTask(done, WED_16).skippedDays).toEqual(['2026-09-14'])
  })

  it('leaves a daily task where it is: today is in play, so nothing was missed (RPT-38)', () => {
    const done = completeTask(createTask('stretch', DAILY, MON_14), MON_14)

    expect(uncompleteTask(done, MON_14).skippedDays).toEqual([])
  })

  it('passes a day over once, however often it is ticked and unticked (RPT-38)', () => {
    const done = completeTask(createTask('review', MONDAYS, MON_14), WED_16)
    const again = uncompleteTask(completeTask(uncompleteTask(done, WED_16), WED_16), WED_16)

    expect(again.skippedDays).toEqual(['2026-09-14'])
  })

  it('passes over nothing from before the task was written (DUE-11)', () => {
    const done = completeTask(createTask('review', MONDAYS, TUE_15), WED_16)

    expect(uncompleteTask(done, WED_16).skippedDays).toEqual([])
  })

  it('does the same when unticking a checklist item reopens the task (CHK-10)', () => {
    const task = addSubtask(createTask('weekly review', MONDAYS, MON_14), 'read notes', MON_14)
    const itemId = task.subtasks[0].id
    const finished = setSubtaskDone(task, itemId, true, WED_16)

    expect(setSubtaskDone(finished, itemId, false, WED_16).skippedDays).toEqual(['2026-09-14'])
  })

  it('does the same when a fresh item reopens a finished task (CHK-13)', () => {
    const done = completeTask(createTask('weekly review', MONDAYS, MON_14), WED_16)

    expect(addSubtask(done, 'read notes', WED_16).skippedDays).toEqual(['2026-09-14'])
  })

  it('keeps a task that happens once out of it', () => {
    const done = completeTask(setDueDate(createTask('buy milk', null, MON_14), '2026-09-14'), WED_16)

    expect(uncompleteTask(done, WED_16).skippedDays).toEqual([])
  })
})

describe('duplicateTask', () => {
  it('copies what the task says: title, description, rule, due date, checklist, tags, reward and urgent (TASK-51)', () => {
    const task = setUrgent(
      setReward(
        addTag(
          setDueDate(addSubtask(setDescription(createTask('pack', null, NOW), 'for the trip'), 'socks', NOW), '2026-09-20'),
          'travel',
        ),
        3,
      ),
      true,
    )
    const copy = duplicateTask(task, LATER)

    expect(copy.title).toBe('pack')
    expect(copy.description).toBe('for the trip')
    expect(copy.dueDate).toBe('2026-09-20')
    expect(copy.subtasks.map((subtask) => subtask.title)).toEqual(['socks'])
    expect(copy.tags).toEqual(['travel'])
    expect(copy.reward).toBe(3)
    expect(copy.urgent).toBe(true)
    expect(duplicateTask(createTask('stretch', DAILY, MON_14), TUE_15).repeat).toEqual(DAILY)
  })

  it('is a task of its own, and so is every item on its checklist (TASK-52)', () => {
    const task = addSubtask(createTask('pack', null, NOW), 'socks', NOW)
    const copy = duplicateTask(task, LATER)

    expect(copy.id).not.toBe(task.id)
    expect(copy.subtasks[0].id).not.toBe(task.subtasks[0].id)
    expect(copy.createdAt).toBe(LATER.toISOString())
    expect(copy.subtasks[0].createdAt).toBe(LATER.toISOString())
  })

  it('starts out todo with its checklist unticked, whatever the original had done (TASK-53)', () => {
    const task = addSubtask(addSubtask(createTask('pack', null, NOW), 'socks', NOW), 'boots', NOW)
    const halfway = setSubtaskDone(task, task.subtasks[0].id, true, NOW)

    expect(duplicateTask(halfway, LATER).subtasks.every((subtask) => subtask.completedAt === null)).toBe(true)

    const copy = duplicateTask(completeTask(task, NOW), LATER)

    expect(copy.status).toBe('todo')
    expect(copy.completedAt).toBeNull()
    expect(copy.subtasks.every((subtask) => subtask.completedAt === null)).toBe(true)
    expect(isComplete(copy, LATER)).toBe(false)
  })

  it("carries none of a habit's history (TASK-53)", () => {
    const habit = completeTask(completeTask(createTask('stretch', DAILY, MON_14), MON_14), TUE_15)

    expect(duplicateTask(habit, TUE_15).doneDays).toEqual([])
    expect(isComplete(duplicateTask(habit, TUE_15), TUE_15)).toBe(false)
  })

  it('never touches the task it was given', () => {
    const task = completeTask(addSubtask(createTask('pack', null, NOW), 'socks', NOW), NOW)
    const before = structuredClone(task)

    duplicateTask(task, LATER)

    expect(task).toEqual(before)
  })
})
