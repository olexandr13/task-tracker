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
import { completeTask, createTask, setDueDate, type Task } from './task'

/*
 * Cases. CHST ids refer to wiki/cases.md. Local dates on purpose: a key is
 * earned for the local day the work was done on.
 */

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
    expect(caseSpan('today', entries, THU_17)).toEqual({ least: 3, most: 20 })
    expect(caseWorking('today', entries, THU_17)).toEqual({
      source: 'today',
      cheapest: 3,
      earned: 41,
      half: 20,
      span: { least: 3, most: 20 },
    })
  })

  it('leaves yesterday, and a case already opened, out of Today', () => {
    const entries = [
      earned('a', '2026-09-16', 400),
      earned('b', '2026-09-17', 10),
      earned(CASE_TODAY_ID, '2026-09-17', 50),
      earned(CASE_DAILY_ID, '2026-09-17', 50),
    ]

    // 10 earned today. Half is 5, which is under the cheapest task, so the case pays 10.
    expect(caseSpan('today', entries, THU_17)).toEqual({ least: 10, most: 10 })
  })

  it('counts a task finished twice as one task', () => {
    const entries = [earned('a', '2026-09-17', 4), earned('a', '2026-09-17', 20), earned('b', '2026-09-17', 6)]

    // The first writing of `a` is its points, so the cheapest is 4. Both writings are still earned: 4 + 20 + 6 = 30, half 15.
    expect(caseSpan('today', entries, THU_17)).toEqual({ least: 4, most: 15 })
  })

  it('pays exactly the cheapest task when half of today is less, as a day of one task is', () => {
    const entries = [earned('a', '2026-09-17', 9)]

    expect(caseSpan('today', entries, THU_17)).toEqual({ least: 9, most: 9 })
  })

  it('pays 1 when today has no task to take a cheapest from', () => {
    expect(caseSpan('today', [], THU_17)).toEqual({ least: 1, most: 1 })
    expect(caseSpan('today', [earned(BONUS_IDS.today, '2026-09-17', 5)], THU_17)).toEqual({ least: 1, most: 2 })
  })

  it('pays the daily case from 1 up to yesterday divided by yesterday’s tasks (CHST-10)', () => {
    const entries = [
      earned('a', '2026-09-16', 10),
      earned('b', '2026-09-16', 20),
      earned(BONUS_IDS.week, '2026-09-16', 7),
      earned('c', '2026-09-17', 100),
      earned(CASE_DAILY_ID, '2026-09-16', 40),
    ]

    // 10 + 20 + 7 = 37, two tasks, so the most is 18. Today’s 100 and yesterday’s case stay out.
    expect(caseSpan('daily', entries, THU_17)).toEqual({ least: 1, most: 18 })
    expect(caseWorking('daily', entries, THU_17)).toEqual({
      source: 'daily',
      earned: 37,
      tasks: 2,
      share: 18,
      span: { least: 1, most: 18 },
    })
  })

  it('pays the daily case 1 when yesterday had no tasks', () => {
    expect(caseSpan('daily', [], THU_17)).toEqual({ least: 1, most: 1 })
    expect(caseSpan('daily', [earned(BONUS_IDS.today, '2026-09-16', 40)], THU_17)).toEqual({ least: 1, most: 1 })
  })

  it('pays Weekly from the cheapest task last week up to that week divided by its tasks (CHST-30)', () => {
    const entries = [
      earned('a', '2026-09-07', 4),
      earned('a', '2026-09-08', 6),
      earned('b', '2026-09-10', 10),
      earned(BONUS_IDS.week, '2026-09-13', 8),
      earned(CASE_WEEK_ID, '2026-09-07', 100),
      earned('c', '2026-09-14', 50),
    ]

    // Previous week is 7–13 September. 4 + 6 + 10 + 8 = 28 across three tasks, so the most is 9.
    // The same task on two days counts twice. Last Monday's Weekly and this Monday stay out.
    expect(caseSpan('week', entries, MON_14)).toEqual({ least: 4, most: 9 })
    expect(caseWorking('week', entries, MON_14)).toEqual({
      source: 'week',
      cheapest: 4,
      earned: 28,
      tasks: 3,
      share: 9,
      span: { least: 4, most: 9 },
    })
  })

  it('counts the same task written twice on one day as one task, and still counts both in the sum', () => {
    const entries = [earned('a', '2026-09-07', 4), earned('a', '2026-09-07', 20)]

    expect(caseSpan('week', entries, MON_14)).toEqual({ least: 4, most: 24 })
  })

  it('pays exactly the cheapest task when last week’s average falls short of it', () => {
    const entries = [earned('a', '2026-09-07', 5), earned('b', '2026-09-08', 6)]

    // 11 across two tasks floors to 5, which is the cheapest.
    expect(caseSpan('week', entries, MON_14)).toEqual({ least: 5, most: 5 })
  })

  it('pays Weekly 1 when last week had no tasks', () => {
    expect(caseSpan('week', [], MON_14)).toEqual({ least: 1, most: 1 })
    expect(caseSpan('week', [earned(BONUS_IDS.week, '2026-09-13', 40)], MON_14)).toEqual({ least: 1, most: 1 })
  })

  it('leaves a case opened last week out of this Monday’s Weekly (CHST-8)', () => {
    const entries = [earned('a', '2026-09-08', 6), earned(CASE_TODAY_ID, '2026-09-08', 40), earned(CASE_DAILY_ID, '2026-09-09', 40)]

    expect(caseSpan('week', entries, MON_14)).toEqual({ least: 6, most: 6 })
  })

  it('draws any amount in the range, the ends included, and says what it was playing for', () => {
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
    expect(caseBlock([today('pack', true)], [], settings(), THU_17)).toBeNull()
    expect(hasKey([today('pack', true)], [], settings(), THU_17)).toBe(true)
  })

  it('is not earned while anything is still to do', () => {
    expect(caseBlock([today('pack', true), today('post')], [], settings(), THU_17)).toBe('unclear')
  })

  it('is not earned by a day with nothing on it, so only the daily case is still on its way', () => {
    expect(caseBlock([], [], settings(), THU_17)).toBe('bonusWaiting')
  })

  it('is not earned by a day smaller than the settings ask for (CHST-3)', () => {
    const tasks = [today('pack', true), today('post', true)]
    expect(caseBlock(tasks, [], settings({ leastTasks: 3 }), THU_17)).toBe('bonusWaiting')
    expect(caseBlock(tasks, [], settings({ leastTasks: 2 }), THU_17)).toBeNull()
  })

  it('is one a day: an opened cases leaves no key', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-17', 12)]
    expect(caseBlock([today('pack', true)], opened, settings(), THU_17)).toBe('bonusWaiting')
  })

  it('still reads as opened once the day comes undone again (CHST-5)', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-17', 12)]
    expect(caseBlock([today('pack', true), today('post')], opened, settings(), THU_17)).toBe('bonusWaiting')
  })

  it('leaves yesterday’s opening out of today', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-16', 12)]
    expect(caseOpened(opened, THU_17)).toBeNull()
    expect(caseBlock([today('pack', true)], opened, settings(), THU_17)).toBeNull()
  })

  it('says what today’s case gave', () => {
    const opened = [earned(CASE_TODAY_ID, '2026-09-17', 12), earned('a', '2026-09-17', 3)]
    expect(caseOpened(opened, THU_17)).toEqual({ taskId: CASE_TODAY_ID, day: '2026-09-17', points: 12 })
  })
})

describe('the cases a day can receive', () => {
  it('keeps today’s case waiting while work is left, and the daily case on its clock', () => {
    expect(caseSlots([today('pack'), today('post')], [], settings(), THU_17)).toEqual([
      { source: 'today', state: 'waiting', at: null },
      { source: 'daily', state: 'waiting', at: dailyKeyTime('2026-09-17') },
      { source: 'week', state: 'waiting', at: null },
    ])
  })

  it('offers today’s case once the day is clear', () => {
    const slots = caseSlots([today('pack', true)], [], settings(), THU_17)
    expect(slots.find((slot) => slot.source === 'today')).toEqual({ source: 'today', state: 'ready', at: null })
  })

  it('offers the daily case once its time has passed, and plans no Today case for an empty day', () => {
    const at = dailyKeyTime('2026-09-17')
    expect(caseSlots([], [], settings(), new Date(at.getTime() + 60_000))).toEqual([
      { source: 'daily', state: 'ready', at: null },
      { source: 'week', state: 'waiting', at: null },
    ])
  })

  it('keeps an opened case until the day ends, and still has nothing left to open (CHST-28)', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-17', 4), earned(CASE_DAILY_ID, '2026-09-17', 1)]
    expect(caseSlots([today('pack', true)], entries, settings(), THU_17)).toEqual([
      { source: 'today', state: 'opened', at: null },
      { source: 'daily', state: 'opened', at: null },
      { source: 'week', state: 'waiting', at: null },
    ])
    expect(caseBlock([today('pack', true)], entries, settings(), THU_17)).toBe('opened')
  })

  it('keeps today’s case opened after the day comes undone again (CHST-5)', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-17', 4)]
    expect(caseSlots([today('pack', true), today('post')], entries, settings(), THU_17)).toEqual([
      { source: 'today', state: 'opened', at: null },
      { source: 'daily', state: 'waiting', at: dailyKeyTime('2026-09-17') },
      { source: 'week', state: 'waiting', at: null },
    ])
  })

  it('offers Weekly on Monday from midnight, and plans it on every other day (CHST-30)', () => {
    expect(caseSlots([], [], settings(), MON_14)).toEqual([
      { source: 'daily', state: 'waiting', at: dailyKeyTime('2026-09-14') },
      { source: 'week', state: 'ready', at: null },
    ])
    expect(caseSlots([], [], settings(), THU_17).find((slot) => slot.source === 'week')).toEqual({
      source: 'week',
      state: 'waiting',
      at: null,
    })
  })

  it('keeps an opened Weekly until Monday ends, then plans it again (CHST-30)', () => {
    const entries = [earned(CASE_WEEK_ID, '2026-09-14', 4)]
    expect(caseSlots([], entries, settings(), MON_14).find((slot) => slot.source === 'week')).toEqual({
      source: 'week',
      state: 'opened',
      at: null,
    })
    const tuesday = new Date(2026, 8, 15, 9, 0)
    expect(caseSlots([], entries, settings(), tuesday).find((slot) => slot.source === 'week')).toEqual({
      source: 'week',
      state: 'waiting',
      at: null,
    })
  })

  it('appears next at Monday midnight, and is already here on Monday', () => {
    expect(nextShareAt(new Date(2026, 8, 13, 23, 50))?.getTime()).toBe(new Date(2026, 8, 14).getTime())
    expect(nextShareAt(MON_14)).toBeNull()
    expect(nextShareAt(new Date(2026, 8, 15, 9, 0))?.getTime()).toBe(new Date(2026, 8, 21).getTime())
  })

  it('forgets an opened case once the day has ended (CHST-28)', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-16', 4), earned(CASE_DAILY_ID, '2026-09-16', 1)]
    const slots = caseSlots([today('pack', true)], entries, settings(), THU_17)
    expect(slots.find((slot) => slot.source === 'today')).toEqual({ source: 'today', state: 'ready', at: null })
    expect(slots.some((slot) => slot.state === 'opened')).toBe(false)
  })

  it('does not plan today’s case when the day is too small to earn one', () => {
    const tasks = [today('pack', true)]
    const slots = caseSlots(tasks, [], settings({ leastTasks: 3 }), THU_17)
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
