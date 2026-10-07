import { describe, expect, it } from 'vitest'
import { BONUS_IDS } from './bonus'
import {
  CASE_DAILY_ID,
  CASE_TODAY_ID,
  CASE_WEEK_ID,
  CASE_QUARTERS,
  caseSlots,
  caseBlock,
  caseJackpot,
  caseOpened,
  caseOpenings,
  caseQuarter,
  caseSpan,
  caseWorking,
  DEFAULT_CASES,
  nextShareAt,
  hasKey,
  isLeastTasks,
  MIN_CASE_POINTS,
  openFairCase,
  openSpan,
  type CaseSettings,
} from './cases'
import type { RewardEntry } from './reward'
import { dailyKeyTime } from './caseKey'
import { completeTask, createTask, deleteTask, setDueDate, type Task } from './task'

/*
 * Cases. CHST ids refer to wiki/cases.md. Local dates on purpose: a key is
 * earned for the local day the work was done on.
 */

/** The account the Drop's moment is worked out for: 12:25 on THU_17. */
const ACCOUNT = 'account-a'
const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)
/** Monday 14 September, before the Drop's earliest hour. */
const MON_14 = new Date(2026, 8, 14, 5, 0)

/** A roll of each number in turn, so a draw is exactly what a test asked for. */
function rolls(...numbers: readonly number[]): () => number {
  let next = 0
  return () => numbers[next++] ?? 0
}

/** A task due today, done or not. */
function today(title: string, done = false): Task {
  const task = setDueDate(createTask(title, null, WED_16), '2026-09-17')
  return done ? completeTask(task, THU_17) : task
}

function earned(taskId: string, day: string, points: number): RewardEntry {
  return { taskId, day, points }
}

function settings(over: Partial<CaseSettings> = {}): CaseSettings {
  return { ...DEFAULT_CASES, ...over }
}

describe('opening one', () => {
  it('pays 1 on the lowest draw and the whole jackpot on the highest (CHST-10)', () => {
    expect(openFairCase(80, rolls(0)).points).toBe(1)
    expect(openFairCase(80, rolls(0.999999)).points).toBe(80)
  })

  it('gives every amount from 1 to the jackpot the same chance (CHST-10)', () => {
    const seen = new Map<number, number>()
    for (let roll = 0; roll < 400; roll++) {
      const { points } = openFairCase(8, rolls((roll + 0.5) / 400))
      seen.set(points, (seen.get(points) ?? 0) + 1)
    }

    expect([...seen.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(new Set(seen.values())).toEqual(new Set([50]))
  })

  it('is worth about half the jackpot an opening', () => {
    let total = 0
    for (let run = 0; run < 4000; run++) total += openFairCase(100).points

    expect(total / 4000).toBeGreaterThan(45)
    expect(total / 4000).toBeLessThan(56)
  })

  it('says what it was playing for', () => {
    expect(openFairCase(40, rolls(0.5))).toEqual({ points: 21, jackpot: 40 })
  })

  it('is never empty, however small the jackpot (CHST-11)', () => {
    expect(openFairCase(1, rolls(0.99)).points).toBe(MIN_CASE_POINTS)
    expect(openFairCase(0, rolls(0.5))).toEqual({ points: 1, jackpot: 1 })
  })

  it('never pays more than the jackpot', () => {
    for (let run = 0; run < 500; run++) {
      const { points } = openFairCase(7)
      expect(points).toBeGreaterThanOrEqual(1)
      expect(points).toBeLessThanOrEqual(7)
    }
  })
})

describe('which quarter of the jackpot it came to', () => {
  it('counts the quarters from 1 to 4, lowest first', () => {
    expect(CASE_QUARTERS).toEqual([1, 2, 3, 4])
  })

  it('puts up to a quarter in the first, and more than three quarters in the fourth (CHST-15)', () => {
    expect(caseQuarter(1, 80)).toBe(1)
    expect(caseQuarter(20, 80)).toBe(1)
    expect(caseQuarter(21, 80)).toBe(2)
    expect(caseQuarter(40, 80)).toBe(2)
    expect(caseQuarter(41, 80)).toBe(3)
    expect(caseQuarter(60, 80)).toBe(3)
    expect(caseQuarter(61, 80)).toBe(4)
    expect(caseQuarter(80, 80)).toBe(4)
  })

  it('splits a jackpot of four one to a quarter, so each is as likely as the next', () => {
    expect([1, 2, 3, 4].map((points) => caseQuarter(points, 4))).toEqual([1, 2, 3, 4])
  })

  it('calls the whole of a jackpot of 1 the top quarter, being all of it', () => {
    expect(caseQuarter(1, 1)).toBe(4)
  })
})

describe('what each case can pay', () => {
  it('pays Today from the cheapest task up to half of today, dropping the remainder (CHST-10)', () => {
    const entries = [
      earned('a', '2026-09-17', 8),
      earned('b', '2026-09-17', 3),
      earned('c', '2026-09-17', 25),
      earned(BONUS_IDS.today, '2026-09-17', 5),
    ]

    // 8 + 3 + 25 + 5 = 41, half is 20. The cheapest task is 3; the bonus is not a task.
    expect(caseSpan('today', [], entries, DEFAULT_CASES, THU_17)).toEqual({ least: 3, most: 20 })
    expect(caseWorking('today', [], entries, DEFAULT_CASES, THU_17)).toEqual({
      source: 'today',
      cheapest: 3,
      earned: 41,
      half: 20,
      unpaid: 0,
      span: { least: 3, most: 20 },
    })
  })

  it('adds one to Today’s most for each task finished today without points (CHST-10)', () => {
    const paid = today('pack', true)
    const tasks = [paid, today('water', true), today('stretch', true), today('post')]
    const entries = [earned(paid.id, '2026-09-17', 10), earned('d', '2026-09-17', 20)]

    // 30 earned, half is 15. `water` and `stretch` earned nothing: 15 + 2 = 17. `post` is not done.
    expect(caseWorking('today', tasks, entries, DEFAULT_CASES, THU_17)).toEqual({
      source: 'today',
      cheapest: 10,
      earned: 30,
      half: 15,
      unpaid: 2,
      span: { least: 10, most: 17 },
    })
  })

  it('never takes a task without points as the cheapest', () => {
    const tasks = [today('water', true)]

    // Nothing earned today: least is 1, and the one task without points raises the most to 1.
    expect(caseSpan('today', tasks, [], DEFAULT_CASES, THU_17)).toEqual({ least: 1, most: 1 })
    expect(caseSpan('today', [...tasks, today('stretch', true)], [], DEFAULT_CASES, THU_17)).toEqual({ least: 1, most: 2 })
  })

  it('leaves yesterday, and a case already opened, out of Today', () => {
    const entries = [
      earned('a', '2026-09-16', 400),
      earned('b', '2026-09-17', 10),
      earned(CASE_TODAY_ID, '2026-09-17', 50),
      earned(CASE_DAILY_ID, '2026-09-17', 50),
    ]

    // 10 earned today. Half is 5, which is under the cheapest task, so the case pays 10.
    expect(caseSpan('today', [], entries, DEFAULT_CASES, THU_17)).toEqual({ least: 10, most: 10 })
  })

  it('counts a task finished twice as one task', () => {
    const entries = [earned('a', '2026-09-17', 4), earned('a', '2026-09-17', 20), earned('b', '2026-09-17', 6)]

    // The first writing of `a` is its points, so the cheapest is 4. Both writings are still earned: 4 + 20 + 6 = 30, half 15.
    expect(caseSpan('today', [], entries, DEFAULT_CASES, THU_17)).toEqual({ least: 4, most: 15 })
  })

  it('pays exactly the cheapest task when half of today is less, as a day of one task is', () => {
    const entries = [earned('a', '2026-09-17', 9)]

    expect(caseSpan('today', [], entries, DEFAULT_CASES, THU_17)).toEqual({ least: 9, most: 9 })
  })

  it('pays 1 when today has no task to take a cheapest from', () => {
    expect(caseSpan('today', [], [], DEFAULT_CASES, THU_17)).toEqual({ least: 1, most: 1 })
    expect(caseSpan('today', [], [earned(BONUS_IDS.today, '2026-09-17', 5)], DEFAULT_CASES, THU_17)).toEqual({ least: 1, most: 2 })
  })

  it('does not count a task with points twice, as one with points and one without', () => {
    const task = today('pack', true)

    // `pack` is done today and in the ledger, so it is a task with points, not one without.
    expect(caseWorking('today', [task], [earned(task.id, '2026-09-17', 10)], DEFAULT_CASES, THU_17)).toMatchObject({ unpaid: 0 })
  })

  it('leaves a task in the trash out of the tasks without points', () => {
    const tasks = [deleteTask(today('water', true), THU_17)]

    expect(caseWorking('today', tasks, [], DEFAULT_CASES, THU_17)).toMatchObject({ unpaid: 0 })
  })

  it('pays the Drop from 0 up to yesterday’s average task plus yesterday’s tasks (CHST-10)', () => {
    const unpaid = completeTask(setDueDate(createTask('water', null, WED_16), '2026-09-16'), WED_16)
    const entries = [
      earned('a', '2026-09-16', 10),
      earned('b', '2026-09-16', 21),
      earned(BONUS_IDS.week, '2026-09-16', 7),
      earned('c', '2026-09-17', 100),
      earned(CASE_DAILY_ID, '2026-09-16', 40),
    ]

    // 10 + 21 = 31 across two tasks with points, so the average is 15. Three tasks were
    // finished, `water` among them: 15 + 3 = 18. The bonus, today’s 100 and yesterday’s case stay out.
    expect(caseSpan('daily', [unpaid], entries, DEFAULT_CASES, THU_17)).toEqual({ least: 0, most: 18 })
    expect(caseWorking('daily', [unpaid], entries, DEFAULT_CASES, THU_17)).toEqual({
      source: 'daily',
      paidPoints: 31,
      paidTasks: 2,
      average: 15,
      tasks: 3,
      span: { least: 0, most: 18 },
    })
  })

  it('pays the Drop 0 when yesterday had no tasks (CHST-11)', () => {
    expect(caseSpan('daily', [], [], DEFAULT_CASES, THU_17)).toEqual({ least: 0, most: 0 })
    expect(caseSpan('daily', [], [earned(BONUS_IDS.today, '2026-09-16', 40)], DEFAULT_CASES, THU_17)).toEqual({ least: 0, most: 0 })
  })

  it('pays the Drop up to the count alone when yesterday’s tasks had no points', () => {
    const tasks = [
      completeTask(setDueDate(createTask('water', null, WED_16), '2026-09-16'), WED_16),
      completeTask(setDueDate(createTask('stretch', null, WED_16), '2026-09-16'), WED_16),
    ]

    expect(caseSpan('daily', tasks, [], DEFAULT_CASES, THU_17)).toEqual({ least: 0, most: 2 })
  })

  it('pays Weekly from the cheapest task last week up to that week’s average task plus its tasks (CHST-30)', () => {
    const entries = [
      earned('a', '2026-09-07', 4),
      earned('a', '2026-09-08', 6),
      earned('b', '2026-09-10', 11),
      earned(BONUS_IDS.week, '2026-09-13', 8),
      earned(CASE_WEEK_ID, '2026-09-07', 100),
      earned('c', '2026-09-14', 50),
    ]

    // Previous week is 7–13 September. 4 + 6 + 11 = 21 across three tasks, an average of 7;
    // three tasks finished, so the most is 10. The same task on two days counts twice. The
    // bonus, last Monday's Weekly and this Monday stay out.
    expect(caseSpan('week', [], entries, DEFAULT_CASES, MON_14)).toEqual({ least: 4, most: 10 })
    expect(caseWorking('week', [], entries, DEFAULT_CASES, MON_14)).toEqual({
      source: 'week',
      cheapest: 4,
      paidPoints: 21,
      paidTasks: 3,
      average: 7,
      tasks: 3,
      span: { least: 4, most: 10 },
    })
  })

  it('counts each day a task without points was done last week (CHST-30)', () => {
    let habit = createTask('water', { kind: 'daily' }, new Date(2026, 8, 1))
    habit = completeTask(habit, new Date(2026, 8, 8, 9, 0))
    habit = completeTask(habit, new Date(2026, 8, 9, 9, 0))
    const entries = [earned('a', '2026-09-07', 6)]

    // One task with points, an average of 6, and three tasks finished: `water` on two days.
    expect(caseWorking('week', [habit], entries, DEFAULT_CASES, MON_14)).toMatchObject({ tasks: 3, span: { least: 6, most: 9 } })
  })

  it('counts the same task written twice on one day as one task', () => {
    const entries = [earned('a', '2026-09-07', 4), earned('a', '2026-09-07', 20)]

    // The first writing is the task: an average of 4, one task, so the most is 5.
    expect(caseSpan('week', [], entries, DEFAULT_CASES, MON_14)).toEqual({ least: 4, most: 5 })
  })

  it('pays Weekly from 1 up to the count alone when last week’s tasks had no points', () => {
    let habit = createTask('water', { kind: 'daily' }, new Date(2026, 8, 1))
    habit = completeTask(habit, new Date(2026, 8, 8, 9, 0))
    habit = completeTask(habit, new Date(2026, 8, 9, 9, 0))

    expect(caseSpan('week', [habit], [], DEFAULT_CASES, MON_14)).toEqual({ least: 1, most: 2 })
  })

  it('pays Weekly 1 when last week had no tasks', () => {
    expect(caseSpan('week', [], [], DEFAULT_CASES, MON_14)).toEqual({ least: 1, most: 1 })
    expect(caseSpan('week', [], [earned(BONUS_IDS.week, '2026-09-13', 40)], DEFAULT_CASES, MON_14)).toEqual({ least: 1, most: 1 })
  })

  it('leaves a case opened last week out of this Monday’s Weekly (CHST-8)', () => {
    const entries = [earned('a', '2026-09-08', 6), earned(CASE_TODAY_ID, '2026-09-08', 40), earned(CASE_DAILY_ID, '2026-09-09', 40)]

    expect(caseSpan('week', [], entries, DEFAULT_CASES, MON_14)).toEqual({ least: 6, most: 7 })
  })

  it('adds nothing for tasks without points to Payday’s most while they are not counted (CHST-32)', () => {
    const paid = today('pack', true)
    const tasks = [paid, today('water', true), today('stretch', true)]
    const entries = [earned(paid.id, '2026-09-17', 10), earned('d', '2026-09-17', 20)]

    // 30 earned, half is 15; `water` and `stretch` would have made it 17.
    expect(caseWorking('today', tasks, entries, settings({ countUnpaid: false }), THU_17)).toMatchObject({
      unpaid: 2,
      span: { least: 10, most: 15 },
    })
    // A day of tasks without points alone still pays 1 (CHST-11).
    expect(caseSpan('today', [today('water', true)], [], settings({ countUnpaid: false }), THU_17)).toEqual({ least: 1, most: 1 })
  })

  it('counts only yesterday’s tasks with points towards the Drop while the others are not counted (CHST-32)', () => {
    const unpaid = completeTask(setDueDate(createTask('water', null, WED_16), '2026-09-16'), WED_16)
    const entries = [earned('a', '2026-09-16', 10), earned('b', '2026-09-16', 21)]

    // An average of 15, plus the two tasks with points: 17. `water` would have made it 18.
    expect(caseSpan('daily', [unpaid], entries, settings({ countUnpaid: false }), THU_17)).toEqual({ least: 0, most: 17 })
    // Yesterday’s tasks had no points: the Drop is empty.
    expect(caseSpan('daily', [unpaid], [], settings({ countUnpaid: false }), THU_17)).toEqual({ least: 0, most: 0 })
  })

  it('counts only last week’s tasks with points towards Weekly while the others are not counted (CHST-32)', () => {
    let habit = createTask('water', { kind: 'daily' }, new Date(2026, 8, 1))
    habit = completeTask(habit, new Date(2026, 8, 8, 9, 0))
    habit = completeTask(habit, new Date(2026, 8, 9, 9, 0))
    const entries = [earned('a', '2026-09-07', 6)]

    // An average of 6, plus the one task with points: 7. `water`, done twice, would have made it 9.
    expect(caseWorking('week', [habit], entries, settings({ countUnpaid: false }), MON_14)).toMatchObject({
      tasks: 3,
      span: { least: 6, most: 7 },
    })
    expect(caseSpan('week', [habit], [], settings({ countUnpaid: false }), MON_14)).toEqual({ least: 1, most: 1 })
  })

  it('draws any amount in the range, the ends included, and says what it was playing for', () => {
    expect(openSpan({ least: 0, most: 5 }, rolls(0))).toEqual({ points: 0, jackpot: 5, least: 0 })
    expect(openSpan({ least: 0, most: 0 }, rolls(0.7))).toEqual({ points: 0, jackpot: 0, least: 0 })
    expect(openSpan({ least: 3, most: 20 }, rolls(0))).toEqual({ points: 3, jackpot: 20, least: 3 })
    expect(openSpan({ least: 3, most: 20 }, rolls(0.999999))).toEqual({ points: 20, jackpot: 20, least: 3 })
    expect(openSpan({ least: 9, most: 9 }, rolls(0.2))).toEqual({ points: 9, jackpot: 9, least: 9 })
  })

  it('gives every amount in the range the same chance', () => {
    const seen = new Map<number, number>()
    for (let roll = 0; roll < 180; roll++) {
      const { points } = openSpan({ least: 4, most: 6 }, rolls((roll + 0.5) / 180))
      seen.set(points, (seen.get(points) ?? 0) + 1)
    }

    expect([...seen.keys()].sort((a, b) => a - b)).toEqual([4, 5, 6])
    expect(new Set(seen.values())).toEqual(new Set([60]))
  })
})

describe('what the key plays for', () => {
  it('plays for everything earned today (CHST-7)', () => {
    const entries = [earned('a', '2026-09-17', 8), earned('b', '2026-09-17', 25), earned('c', '2026-09-17', 3)]
    expect(caseJackpot(entries, THU_17)).toBe(36)
  })

  it('counts a bonus paid today, as the Today tile does', () => {
    const entries = [earned('a', '2026-09-17', 4), earned(BONUS_IDS.today, '2026-09-17', 5)]
    expect(caseJackpot(entries, THU_17)).toBe(9)
  })

  it('reads only today', () => {
    const entries = [earned('a', '2026-09-16', 400), earned('b', '2026-09-17', 9)]
    expect(caseJackpot(entries, THU_17)).toBe(9)
  })

  it('leaves Cases out of what it plays for (CHST-8)', () => {
    const entries = [earned('a', '2026-09-17', 10), earned(CASE_TODAY_ID, '2026-09-17', 7)]
    expect(caseJackpot(entries, THU_17)).toBe(10)
  })

  it('plays for the least a case gives on a day that earned nothing yet, never for nothing (CHST-9)', () => {
    expect(caseJackpot([], THU_17)).toBe(MIN_CASE_POINTS)
  })

  it('has no ceiling but the day itself', () => {
    const entries = [earned('a', '2026-09-17', 999), earned('b', '2026-09-17', 999)]
    expect(caseJackpot(entries, THU_17)).toBe(1998)
  })
})

describe('earning a key', () => {
  it('is earned by a day with everything done (CHST-2)', () => {
    expect(caseBlock([today('pack', true)], [], settings(), ACCOUNT, THU_17)).toBeNull()
    expect(hasKey([today('pack', true)], [], settings(), ACCOUNT, THU_17)).toBe(true)
  })

  it('is not earned while anything is still to do', () => {
    expect(caseBlock([today('pack', true), today('post')], [], settings(), ACCOUNT, THU_17)).toBe('unclear')
  })

  it('is not earned by a day with nothing on it, so only the daily case is still on its way', () => {
    expect(caseBlock([], [], settings(), ACCOUNT, THU_17)).toBe('bonusWaiting')
  })

  it('is not earned by a day smaller than the settings ask for (CHST-3)', () => {
    const tasks = [today('pack', true), today('post', true)]
    expect(caseBlock(tasks, [], settings({ leastTasks: 3 }), ACCOUNT, THU_17)).toBe('bonusWaiting')
    expect(caseBlock(tasks, [], settings({ leastTasks: 2 }), ACCOUNT, THU_17)).toBeNull()
  })

  it('is one a day: an opened cases leaves no key', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-17', 12)]
    expect(caseBlock([today('pack', true)], opened, settings(), ACCOUNT, THU_17)).toBe('bonusWaiting')
  })

  it('still reads as opened once the day comes undone again (CHST-5)', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-17', 12)]
    expect(caseBlock([today('pack', true), today('post')], opened, settings(), ACCOUNT, THU_17)).toBe('bonusWaiting')
  })

  it('leaves yesterday’s opening out of today', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-16', 12)]
    expect(caseOpened(opened, THU_17)).toBeNull()
    expect(caseBlock([today('pack', true)], opened, settings(), ACCOUNT, THU_17)).toBeNull()
  })

  it('says what today’s case gave', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-17', 12), earned('a', '2026-09-17', 3)]
    expect(caseOpened(opened, THU_17)).toEqual({ taskId: CASE_TODAY_ID, day: '2026-09-17', points: 12 })
  })

  it('lists what each case opened today gave, in the order the page shows the cases (CHST-33)', () => {
    const ledger = [
      earned(CASE_WEEK_ID, '2026-09-17', 9),
      earned('a', '2026-09-17', 3),
      earned(CASE_DAILY_ID, '2026-09-17', 0),
      earned(CASE_TODAY_ID, '2026-09-16', 12),
      earned(CASE_TODAY_ID, '2026-09-17', 7),
    ]
    expect(caseOpenings(ledger, THU_17)).toEqual([
      { source: 'today', points: 7 },
      { source: 'daily', points: 0 },
      { source: 'week', points: 9 },
    ])
  })

  it('lists none of an earlier day’s openings (CHST-33)', () => {
    const ledger = [earned(CASE_TODAY_ID, '2026-09-16', 12), earned(CASE_DAILY_ID, '2026-09-16', 4)]
    expect(caseOpenings(ledger, THU_17)).toEqual([])
  })
})

describe('the cases a day can receive', () => {
  /** Midnight on Monday 21 September, when Weekly is next ready after the week of the 14th. */
  const NEXT_MONDAY = new Date(2026, 8, 21)

  it('keeps today’s case waiting while work is left, and the daily case on its clock', () => {
    expect(caseSlots([today('pack'), today('post')], [], settings(), ACCOUNT, THU_17)).toEqual([
      { source: 'today', state: 'waiting', at: null, tasksLeft: 2 },
      { source: 'daily', state: 'waiting', at: dailyKeyTime('2026-09-17', ACCOUNT) },
      { source: 'week', state: 'waiting', at: NEXT_MONDAY },
    ])
  })

  it('counts the tasks still to finish before today’s case, a day too small included (CHST-31)', () => {
    const tasks = [today('pack', true), today('post')]
    const left = (leastTasks: number) =>
      caseSlots(tasks, [], settings({ leastTasks }), ACCOUNT, THU_17).find((slot) => slot.source === 'today')?.tasksLeft

    expect(left(1)).toBe(1)
    // Two tasks asked for, one done, three needed: the one left and one more still to add.
    expect(left(3)).toBe(2)
  })

  it('offers today’s case once the day is clear', () => {
    const slots = caseSlots([today('pack', true)], [], settings(), ACCOUNT, THU_17)
    expect(slots.find((slot) => slot.source === 'today')).toEqual({ source: 'today', state: 'ready', at: null })
  })

  it('offers the daily case once its time has passed, and plans no Today case for an empty day', () => {
    const at = dailyKeyTime('2026-09-17', ACCOUNT)
    expect(caseSlots([], [], settings(), ACCOUNT, new Date(at.getTime() + 60_000))).toEqual([
      { source: 'daily', state: 'ready', at: null },
      { source: 'week', state: 'waiting', at: NEXT_MONDAY },
    ])
  })

  it('keeps an opened case until the day ends, and still has nothing left to open (CHST-28)', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-17', 4), earned(CASE_DAILY_ID, '2026-09-17', 1)]
    expect(caseSlots([today('pack', true)], entries, settings(), ACCOUNT, THU_17)).toEqual([
      { source: 'today', state: 'opened', at: null },
      { source: 'daily', state: 'opened', at: null },
      { source: 'week', state: 'waiting', at: NEXT_MONDAY },
    ])
    expect(caseBlock([today('pack', true)], entries, settings(), ACCOUNT, THU_17)).toBe('opened')
  })

  it('keeps today’s case opened after the day comes undone again (CHST-5)', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-17', 4)]
    expect(caseSlots([today('pack', true), today('post')], entries, settings(), ACCOUNT, THU_17)).toEqual([
      { source: 'today', state: 'opened', at: null },
      { source: 'daily', state: 'waiting', at: dailyKeyTime('2026-09-17', ACCOUNT) },
      { source: 'week', state: 'waiting', at: NEXT_MONDAY },
    ])
  })

  it('offers Weekly on Monday from midnight, and plans it on every other day, until that midnight (CHST-30)', () => {
    expect(caseSlots([], [], settings(), ACCOUNT, MON_14)).toEqual([
      { source: 'daily', state: 'waiting', at: dailyKeyTime('2026-09-14', ACCOUNT) },
      { source: 'week', state: 'ready', at: null },
    ])
    expect(caseSlots([], [], settings(), ACCOUNT, THU_17).find((slot) => slot.source === 'week')).toEqual({
      source: 'week',
      state: 'waiting',
      at: NEXT_MONDAY,
    })
  })

  it('keeps an opened Weekly until Monday ends, then plans it again (CHST-30)', () => {
    const entries = [earned(CASE_WEEK_ID, '2026-09-14', 4)]
    expect(caseSlots([], entries, settings(), ACCOUNT, MON_14).find((slot) => slot.source === 'week')).toEqual({
      source: 'week',
      state: 'opened',
      at: null,
    })
    const tuesday = new Date(2026, 8, 15, 9, 0)
    expect(caseSlots([], entries, settings(), ACCOUNT, tuesday).find((slot) => slot.source === 'week')).toEqual({
      source: 'week',
      state: 'waiting',
      at: NEXT_MONDAY,
    })
  })

  it('appears next at Monday midnight, and is already here on Monday', () => {
    expect(nextShareAt(new Date(2026, 8, 13, 23, 50))?.getTime()).toBe(new Date(2026, 8, 14).getTime())
    expect(nextShareAt(MON_14)).toBeNull()
    expect(nextShareAt(new Date(2026, 8, 15, 9, 0))?.getTime()).toBe(new Date(2026, 8, 21).getTime())
  })

  it('forgets an opened case once the day has ended (CHST-28)', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-16', 4), earned(CASE_DAILY_ID, '2026-09-16', 1)]
    const slots = caseSlots([today('pack', true)], entries, settings(), ACCOUNT, THU_17)
    expect(slots.find((slot) => slot.source === 'today')).toEqual({ source: 'today', state: 'ready', at: null })
    expect(slots.some((slot) => slot.state === 'opened')).toBe(false)
  })

  it('does not plan today’s case when the day is too small to earn one', () => {
    const tasks = [today('pack', true)]
    const slots = caseSlots(tasks, [], settings({ leastTasks: 3 }), ACCOUNT, THU_17)
    expect(slots.some((slot) => slot.source === 'today')).toBe(false)
  })
})

describe('how many tasks a day must ask for', () => {
  it('takes a whole number from one, there being no day of no tasks to clear', () => {
    expect(isLeastTasks(1)).toBe(true)
    expect(isLeastTasks(99)).toBe(true)
    expect(isLeastTasks(0)).toBe(false)
    expect(isLeastTasks(100)).toBe(false)
    expect(isLeastTasks(2.5)).toBe(false)
  })

  it('starts at one, so any cleared day earns a key until it is asked to be bigger', () => {
    expect(DEFAULT_CASES.leastTasks).toBe(1)
  })
})
