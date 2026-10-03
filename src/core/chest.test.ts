import { describe, expect, it } from 'vitest'
import { BONUS_IDS } from './bonus'
import {
  CHEST_ID,
  CHEST_QUARTERS,
  chestBlock,
  chestJackpot,
  chestOpened,
  chestQuarter,
  DEFAULT_CHEST,
  hasKey,
  isLeastTasks,
  MIN_CHEST_POINTS,
  openChest,
  type ChestSettings,
} from './chest'
import type { RewardEntry } from './reward'
import { completeTask, createTask, setDueDate, type Task } from './task'

/*
 * The chest. CHST ids refer to wiki/chest.md. Local dates on purpose: a key is
 * earned for the local day the work was done on.
 */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)

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

function settings(over: Partial<ChestSettings> = {}): ChestSettings {
  return { ...DEFAULT_CHEST, ...over }
}

describe('opening one', () => {
  it('pays 1 on the lowest draw and the whole jackpot on the highest (CHST-10)', () => {
    expect(openChest(80, rolls(0)).points).toBe(1)
    expect(openChest(80, rolls(0.999999)).points).toBe(80)
  })

  it('gives every amount from 1 to the jackpot the same chance (CHST-10)', () => {
    const seen = new Map<number, number>()
    for (let roll = 0; roll < 400; roll++) {
      const { points } = openChest(8, rolls((roll + 0.5) / 400))
      seen.set(points, (seen.get(points) ?? 0) + 1)
    }

    expect([...seen.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(new Set(seen.values())).toEqual(new Set([50]))
  })

  it('is worth about half the jackpot an opening', () => {
    let total = 0
    for (let run = 0; run < 4000; run++) total += openChest(100).points

    expect(total / 4000).toBeGreaterThan(45)
    expect(total / 4000).toBeLessThan(56)
  })

  it('says what it was playing for', () => {
    expect(openChest(40, rolls(0.5))).toEqual({ points: 21, jackpot: 40 })
  })

  it('is never empty, however small the jackpot (CHST-11)', () => {
    expect(openChest(1, rolls(0.99)).points).toBe(MIN_CHEST_POINTS)
    expect(openChest(0, rolls(0.5))).toEqual({ points: 1, jackpot: 1 })
  })

  it('never pays more than the jackpot', () => {
    for (let run = 0; run < 500; run++) {
      const { points } = openChest(7)
      expect(points).toBeGreaterThanOrEqual(1)
      expect(points).toBeLessThanOrEqual(7)
    }
  })
})

describe('which quarter of the jackpot it came to', () => {
  it('counts the quarters from 1 to 4, lowest first', () => {
    expect(CHEST_QUARTERS).toEqual([1, 2, 3, 4])
  })

  it('puts up to a quarter in the first, and more than three quarters in the fourth (CHST-15)', () => {
    expect(chestQuarter(1, 80)).toBe(1)
    expect(chestQuarter(20, 80)).toBe(1)
    expect(chestQuarter(21, 80)).toBe(2)
    expect(chestQuarter(40, 80)).toBe(2)
    expect(chestQuarter(41, 80)).toBe(3)
    expect(chestQuarter(60, 80)).toBe(3)
    expect(chestQuarter(61, 80)).toBe(4)
    expect(chestQuarter(80, 80)).toBe(4)
  })

  it('splits a jackpot of four one to a quarter, so each is as likely as the next', () => {
    expect([1, 2, 3, 4].map((points) => chestQuarter(points, 4))).toEqual([1, 2, 3, 4])
  })

  it('calls the whole of a jackpot of 1 the top quarter, being all of it', () => {
    expect(chestQuarter(1, 1)).toBe(4)
  })
})

describe('what the key plays for', () => {
  it('plays for everything earned today (CHST-7)', () => {
    const entries = [earned('a', '2026-09-17', 8), earned('b', '2026-09-17', 25), earned('c', '2026-09-17', 3)]
    expect(chestJackpot(entries, THU_17)).toBe(36)
  })

  it('counts a bonus paid today, as the Today tile does', () => {
    const entries = [earned('a', '2026-09-17', 4), earned(BONUS_IDS.today, '2026-09-17', 5)]
    expect(chestJackpot(entries, THU_17)).toBe(9)
  })

  it('reads only today', () => {
    const entries = [earned('a', '2026-09-16', 400), earned('b', '2026-09-17', 9)]
    expect(chestJackpot(entries, THU_17)).toBe(9)
  })

  it('leaves the chest out of what it plays for (CHST-8)', () => {
    const entries = [earned('a', '2026-09-17', 10), earned(CHEST_ID, '2026-09-17', 7)]
    expect(chestJackpot(entries, THU_17)).toBe(10)
  })

  it('plays for the least a chest gives on a day that earned nothing yet, never for nothing (CHST-9)', () => {
    expect(chestJackpot([], THU_17)).toBe(MIN_CHEST_POINTS)
  })

  it('has no ceiling but the day itself', () => {
    const entries = [earned('a', '2026-09-17', 999), earned('b', '2026-09-17', 999)]
    expect(chestJackpot(entries, THU_17)).toBe(1998)
  })
})

describe('earning a key', () => {
  it('is earned by a day with everything done (CHST-2)', () => {
    expect(chestBlock([today('pack', true)], [], settings(), THU_17)).toBeNull()
    expect(hasKey([today('pack', true)], [], settings(), THU_17)).toBe(true)
  })

  it('is not earned while anything is still to do', () => {
    expect(chestBlock([today('pack', true), today('post')], [], settings(), THU_17)).toBe('unclear')
  })

  it('is not earned by a day with nothing on it', () => {
    expect(chestBlock([], [], settings(), THU_17)).toBe('unclear')
  })

  it('is not earned by a day smaller than the settings ask for (CHST-3)', () => {
    const tasks = [today('pack', true), today('post', true)]
    expect(chestBlock(tasks, [], settings({ leastTasks: 3 }), THU_17)).toBe('tooSmall')
    expect(chestBlock(tasks, [], settings({ leastTasks: 2 }), THU_17)).toBeNull()
  })

  it('is one a day: an opened chest leaves no key', () => {
    const opened = [earned(CHEST_ID, '2026-09-17', 12)]
    expect(chestBlock([today('pack', true)], opened, settings(), THU_17)).toBe('opened')
  })

  it('still reads as opened once the day comes undone again (CHST-5)', () => {
    const opened = [earned(CHEST_ID, '2026-09-17', 12)]
    expect(chestBlock([today('pack', true), today('post')], opened, settings(), THU_17)).toBe('opened')
  })

  it('leaves yesterday’s opening out of today', () => {
    const opened = [earned(CHEST_ID, '2026-09-16', 12)]
    expect(chestOpened(opened, THU_17)).toBeNull()
    expect(chestBlock([today('pack', true)], opened, settings(), THU_17)).toBeNull()
  })

  it('says what today’s chest gave', () => {
    const opened = [earned(CHEST_ID, '2026-09-17', 12), earned('a', '2026-09-17', 3)]
    expect(chestOpened(opened, THU_17)).toEqual({ taskId: CHEST_ID, day: '2026-09-17', points: 12 })
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
    expect(DEFAULT_CHEST.leastTasks).toBe(1)
  })
})
