import { describe, expect, it } from 'vitest'
import { createActivityEntry } from './activity'
import { createCategory, logCategoryTime, removeCategoryTime } from './balance'
import { skipOccurrence, unskipToday } from './due'
import { setDoneOnDay } from './habit'
import { createJournalEntry, JOURNAL_GOAL, JOURNAL_SECTIONS } from './journal'
import type { Repeat } from './repeat'
import { setReward } from './reward'
import {
  addSubtask,
  completeTask,
  createTask,
  deleteTask,
  restoreTask,
  setDueDate,
  setRepeat,
  uncompleteTask,
  type Task,
} from './task'
import { logTime, removeTimeEntry, changeTimeEntry, setTimeGoal } from './timeLog'
import {
  activityXp,
  applyXp,
  categoryXp,
  clearXp,
  completionXp,
  habitDayXp,
  journalXp,
  leastXp,
  levelFloor,
  levelOf,
  levelStep,
  pointsXp,
  settleXp,
  startXp,
  taskXp,
  timeXp,
  totalXp,
  type XpProgress,
} from './xp'

/*
 * LVL ids refer to wiki/levels.md. Local dates on purpose: XP counts on the
 * local day. September 2026 runs Mon 14, Tue 15, Wed 16, Thu 17.
 */

const MON_14 = new Date(2026, 8, 14, 9, 0)
const TUE_15 = new Date(2026, 8, 15, 9, 0)
const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)

const DAILY: Repeat = { kind: 'daily' }
const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }

/** A habit worth `reward` points a day, begun on Monday. */
function habit(reward: number | null = 1): Task {
  return setReward(createTask('stretch', DAILY, MON_14), reward)
}

/** What changing one task comes to, as `taskXp` sees a list of one. */
function xpOf(before: Task, after: Task, now: Date = TUE_15) {
  return taskXp([before], [after], now)
}

describe('levels (LVL-3)', () => {
  it('starts everyone at level 0, costs 100 XP to reach level 1, and 10% more for each level after', () => {
    expect(levelOf(0)).toEqual({ level: 0, total: 0, into: 0, step: 100 })
    expect(levelStep(0)).toBe(100)
    expect(levelStep(1)).toBe(110)
    expect(levelStep(2)).toBe(121)
    for (let level = 0; level < 60; level += 1) expect(levelStep(level + 1)).toBeGreaterThan(levelStep(level))
  })

  it('begins each level where the steps below it add up to', () => {
    expect(levelFloor(0)).toBe(0)
    expect(levelFloor(1)).toBe(100)
    expect(levelFloor(4)).toBe(464)
  })

  it('reads a total as its level, how far into it, and what it asks', () => {
    expect(levelOf(99)).toEqual({ level: 0, total: 99, into: 99, step: 100 })
    expect(levelOf(100)).toEqual({ level: 1, total: 100, into: 0, step: 110 })
    expect(levelOf(463).level).toBe(3)
    expect(levelOf(464)).toEqual({ level: 4, total: 464, into: 0, step: 146 })
    expect(levelOf(levelFloor(80) + 1).level).toBe(80)
  })

  it('stays at level 0 below zero, nothing into it', () => {
    expect(levelOf(-40)).toEqual({ level: 0, total: -40, into: 0, step: 100 })
  })
})

describe('where XP stands (LVL-1)', () => {
  const begun: XpProgress = startXp('2026-09-15')

  it('begins at nothing, on the day it began (LVL-2)', () => {
    expect(begun).toEqual({ xp: 0, startedOn: '2026-09-15', settledThrough: null, addsOn: null, adds: 0 })
  })

  it('counts the first ten tasks added in a day, and gives back one taken back so the eleventh counts (LVL-4)', () => {
    let progress = applyXp(begun, { xp: 0, addedToday: 12 }, '2026-09-15')
    expect(progress).toMatchObject({ xp: 10, addsOn: '2026-09-15', adds: 12 })

    progress = applyXp(progress, { xp: 0, addedToday: -1 }, '2026-09-15')
    expect(progress).toMatchObject({ xp: 10, adds: 11 })
    progress = applyXp(progress, { xp: 0, addedToday: -3 }, '2026-09-15')
    expect(progress).toMatchObject({ xp: 8, adds: 8 })
  })

  it('starts the count again on a new day', () => {
    const yesterday = applyXp(begun, { xp: 0, addedToday: 10 }, '2026-09-15')
    expect(applyXp(yesterday, { xp: 3, addedToday: 1 }, '2026-09-16')).toMatchObject({ xp: 14, addsOn: '2026-09-16', adds: 1 })
  })

  it('adds the points earned since XP began, one XP each, to the total (LVL-9)', () => {
    const entries = [
      { taskId: 'a', day: '2026-09-14', points: 50 },
      { taskId: 'b', day: '2026-09-15', points: 5 },
    ]
    expect(pointsXp(entries, '2026-09-15')).toBe(5)
    expect(totalXp({ ...begun, xp: 20 }, entries)).toBe(25)
  })

  it('never puts the total below zero, and keeps no more lost than the points gave (LVL-17)', () => {
    const entries = [{ taskId: 'a', day: '2026-09-15', points: 5 }]
    expect(totalXp({ ...begun, xp: -40 }, entries)).toBe(0)
    expect(leastXp(begun, entries)).toBe(-5)
  })
})

describe('completionXp (LVL-5)', () => {
  it('is 2 for a task with nothing more to it', () => {
    expect(completionXp(createTask('call mum', null, MON_14))).toBe(2)
  })

  it('adds one for every quarter of an hour its time goal asks, up to 8', () => {
    const task = createTask('read', null, MON_14)
    expect(completionXp(setTimeGoal(task, 30))).toBe(4)
    expect(completionXp(setTimeGoal(task, 44))).toBe(4)
    expect(completionXp(setTimeGoal(task, 600))).toBe(10)
  })

  it('adds one for every item of its checklist, up to 5', () => {
    let task = createTask('pack', null, MON_14)
    for (const item of ['a', 'b']) task = addSubtask(task, item, MON_14)
    expect(completionXp(task)).toBe(4)
    for (const item of ['c', 'd', 'e', 'f', 'g']) task = addSubtask(task, item, MON_14)
    expect(completionXp(task)).toBe(7)
  })

  it("makes a habit's day worth its points as well (LVL-12)", () => {
    expect(habitDayXp(habit(3))).toBe(5)
    expect(habitDayXp(habit(null))).toBe(2)
  })
})

describe('taskXp', () => {
  it('counts a task added today toward the day’s adds (LVL-4)', () => {
    expect(taskXp([], [createTask('call mum', null, TUE_15)], TUE_15)).toEqual({ xp: 0, addedToday: 1 })
  })

  it('gives finishing a task what it is worth, and takes it back with the tick (LVL-5)', () => {
    const task = setTimeGoal(createTask('read', null, MON_14), 30)
    const done = completeTask(task, TUE_15)

    expect(xpOf(task, done)).toEqual({ xp: 4, addedToday: 0 })
    expect(xpOf(done, uncompleteTask(done, TUE_15))).toEqual({ xp: -4, addedToday: 0 })
  })

  it('takes back adding a task never finished as it goes to the trash, and gives it again restored (LVL-4)', () => {
    const today = createTask('call mum', null, TUE_15)
    expect(xpOf(today, deleteTask(today, TUE_15))).toEqual({ xp: 0, addedToday: -1 })

    const older = deleteTask(createTask('call mum', null, MON_14), MON_14)
    expect(xpOf(older, restoreTask(older))).toEqual({ xp: 1, addedToday: 0 })
  })

  it('keeps what adding gave for a task finished before it went to the trash', () => {
    const done = completeTask(createTask('call mum', null, MON_14), MON_14)
    expect(xpOf(done, deleteTask(done, TUE_15))).toEqual({ xp: 0, addedToday: 0 })
  })

  it("costs a habit's skip what its day is worth, and gives it back with the skip (LVL-12)", () => {
    const task = habit(3)
    const skipped = skipOccurrence(task, TUE_15)

    expect(xpOf(task, skipped)).toEqual({ xp: -5, addedToday: 0 })
    expect(xpOf(skipped, unskipToday(skipped, TUE_15))).toEqual({ xp: 5, addedToday: 0 })
  })

  it('puts a day already counted right when it is marked done afterwards, and again when taken back (LVL-12, LVL-13)', () => {
    const task = habit(1)
    const settled = { startedOn: '2026-09-14', settledThrough: '2026-09-15' }
    const marked = setDoneOnDay(task, '2026-09-14', true, WED_16)

    // Done: 2; its miss given back: twice its worth of 3; the day's idleness given back: 10.
    expect(taskXp([task], [marked], WED_16, settled)).toEqual({ xp: 2 + 6 + 10, addedToday: 0 })
    expect(taskXp([marked], [task], WED_16, settled)).toEqual({ xp: -18, addedToday: 0 })
  })

  it('gives back no idleness for a day something else was done on', () => {
    const task = habit(1)
    const other = completeTask(createTask('call mum', null, MON_14), MON_14)
    const settled = { startedOn: '2026-09-14', settledThrough: '2026-09-15' }
    const marked = setDoneOnDay(task, '2026-09-14', true, WED_16)

    expect(taskXp([task, other], [marked, other], WED_16, settled).xp).toBe(2 + 6)
  })

  it('gives every full quarter of an hour logged, and takes back a session taken back or shortened (LVL-7)', () => {
    const task = createTask('read', null, MON_14)
    const logged = logTime(task, 45, TUE_15)
    const entry = logged.timeLog[0]

    expect(xpOf(task, logged)).toEqual({ xp: 3, addedToday: 0 })
    expect(xpOf(logged, changeTimeEntry(logged, entry.id, { seconds: 20 * 60, comment: null }))).toEqual({ xp: -2, addedToday: 0 })
    expect(xpOf(logged, removeTimeEntry(logged, entry.id))).toEqual({ xp: -3, addedToday: 0 })
  })

  it('keeps what a session gave once it is let go of with time', () => {
    const task = logTime(createTask('stretch', DAILY, MON_14), 30, new Date(2026, 6, 1, 9, 0))
    const later = new Date(2026, 8, 15, 9, 0)
    expect(xpOf(task, logTime(task, 10, later), later)).toEqual({ xp: 0, addedToday: 0 })
  })

  it('gives and takes nothing for a change of rule, or for a task left as it was', () => {
    const done = completeTask(createTask('call mum', null, MON_14), MON_14)
    expect(xpOf(done, setRepeat(done, MONDAYS, TUE_15))).toEqual({ xp: 0, addedToday: 0 })
    expect(xpOf(done, done)).toEqual({ xp: 0, addedToday: 0 })
  })
})

describe('clearXp (LVL-6)', () => {
  it('gives 5, 25 and 100 for clearing Today, the week and the month, and takes them back when unclear again', () => {
    const task = setDueDate(createTask('call mum', null, TUE_15), '2026-09-15')
    const done = completeTask(task, TUE_15)

    expect(clearXp([task], [done], TUE_15)).toBe(130)
    expect(clearXp([done], [task], TUE_15)).toBe(-130)
  })

  it('gives nothing for a period with nothing in it', () => {
    expect(clearXp([], [], TUE_15)).toBe(0)
  })
})

describe('time logged elsewhere (LVL-7)', () => {
  it('is worth one for every full quarter of an hour', () => {
    expect(timeXp(14 * 60 + 59)).toBe(0)
    expect(timeXp(15 * 60)).toBe(1)
    expect(timeXp(60 * 60)).toBe(4)
  })

  it("counts time logged straight to a category, and takes it back with the session or the category", () => {
    const rest = createCategory('Rest', MON_14)
    const logged = logCategoryTime(rest, 30, TUE_15)

    expect(categoryXp([rest], [logged], TUE_15)).toBe(2)
    expect(categoryXp([logged], [removeCategoryTime(logged, logged.timeLog[0].id)], TUE_15)).toBe(-2)
    expect(categoryXp([logged], [], TUE_15)).toBe(-2)
    expect(categoryXp([], [logged], TUE_15)).toBe(2)
  })

  it("counts an activity typed, not one made from a task's session", () => {
    const typed = createActivityEntry('Reading', 30 * 60, { day: '2026-09-15', hour: 14 }, TUE_15)
    const fromSession = { ...typed, id: 'a2', session: { taskId: 't', entryId: 'e' } }

    expect(activityXp([], [typed, fromSession])).toBe(2)
    expect(activityXp([typed, fromSession], [fromSession])).toBe(-2)
  })
})

describe('journalXp (LVL-8)', () => {
  const day = '2026-09-15'
  const line = (section: (typeof JOURNAL_SECTIONS)[number]) => createJournalEntry(section, 'a good thing', day, TUE_15)

  it('gives 1 for the first thing written in a day, and nothing for the next', () => {
    const first = line('good')
    expect(journalXp([], [first], [day])).toBe(1)
    expect(journalXp([first], [first, line('gratitude')], [day])).toBe(0)
  })

  it('gives 2 more once every section has its five lines, and takes them back as one goes', () => {
    const full = JOURNAL_SECTIONS.flatMap((section) => Array.from({ length: JOURNAL_GOAL }, () => line(section)))
    expect(journalXp(full.slice(1), full, [day])).toBe(2)
    expect(journalXp(full, full.slice(1), [day])).toBe(-2)
    expect(journalXp([full[0]], [], [day])).toBe(-1)
  })
})

describe('settleXp', () => {
  const begun = startXp('2026-09-14')

  it('costs a missed habit day twice what the day is worth, and a day with nothing finished 10, up to yesterday (LVL-12, LVL-13)', () => {
    const task = setDoneOnDay(habit(1), '2026-09-15', true, THU_17)
    // Monday and Wednesday missed, 2 × 3 each; and nothing at all finished on either.
    expect(settleXp([task], begun, null, THU_17)).toEqual({ xp: -12 - 20, settledThrough: '2026-09-16' })
  })

  it('counts nothing on a day rested on, nor anything after the last day counted', () => {
    const skipped = skipOccurrence(habit(1), MON_14)
    expect(settleXp([skipped], begun, null, TUE_15)).toEqual({ xp: -10, settledThrough: '2026-09-14' })
    // Tuesday alone, the day after the last counted: missed, and nothing finished.
    expect(settleXp([skipped], { ...begun, settledThrough: '2026-09-14' }, null, WED_16)).toEqual({ xp: -16, settledThrough: '2026-09-15' })
  })

  it('counts nothing before XP began, nor today', () => {
    expect(settleXp([habit(1)], startXp('2026-09-16'), null, WED_16)).toBeNull()
    expect(settleXp([habit(1)], { ...begun, settledThrough: '2026-09-15' }, null, WED_16)).toBeNull()
  })

  it('costs nothing for a habit after it went to the trash', () => {
    const deleted = deleteTask(habit(1), TUE_15)
    const other = completeTask(createTask('call mum', null, MON_14), MON_14)
    const done = setDoneOnDay(completeTask(createTask('walk', DAILY, MON_14), TUE_15), '2026-09-16', true, THU_17)
    // Monday alone for the deleted one (twice 3), and Monday for the walk, worth 2 with no points.
    expect(settleXp([deleted, other, done], begun, null, THU_17)?.xp).toBe(-6 - 4)
  })

  it('costs 1 for every task overdue at the end of a day, habits aside, and no more than 10 a day (LVL-14)', () => {
    const late = setDueDate(createTask('taxes', null, MON_14), '2026-09-14')
    const finished = completeTask(createTask('call mum', null, MON_14), TUE_15)
    // Tuesday ends with the taxes overdue: 1, and something finished.
    expect(settleXp([late, finished], { ...begun, settledThrough: '2026-09-14' }, null, WED_16)).toEqual({
      xp: -1,
      settledThrough: '2026-09-15',
    })

    const many = Array.from({ length: 14 }, () => setDueDate(createTask('chore', null, MON_14), '2026-09-14'))
    expect(settleXp([...many, finished], { ...begun, settledThrough: '2026-09-14' }, null, WED_16)?.xp).toBe(-10)
  })

  it('counts a task finished later as overdue on the days it was still to do', () => {
    const late = completeTask(setDueDate(createTask('taxes', null, MON_14), '2026-09-14'), WED_16)
    const finished = completeTask(createTask('call mum', null, MON_14), TUE_15)
    expect(settleXp([late, finished], { ...begun, settledThrough: '2026-09-14' }, null, THU_17)).toEqual({
      xp: -1,
      settledThrough: '2026-09-16',
    })
  })
})
