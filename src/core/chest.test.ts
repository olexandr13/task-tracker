import { describe, expect, it } from 'vitest'
import { BONUS_IDS } from './bonus'
import {
  CHEST_ID,
  CHEST_JACKPOTS,
  CHEST_MAX_JACKPOT,
  CHEST_PRIZES,
  CHEST_TIERS,
  chestBlock,
  chestJackpot,
  chestOpened,
  chestPoints,
  DEFAULT_CHEST,
  hasKey,
  isLeastTasks,
  MIN_CHEST_POINTS,
  openChest,
  TYPICAL_DAYS,
  type ChestSettings,
  type ChestTier,
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

/** Where a tier's band starts, in the roll `openChest` reads tiers from. */
function tierRoll(tier: ChestTier): number {
  const total = CHEST_PRIZES.reduce((sum, prize) => sum + prize.weight, 0)
  let before = 0

  for (const prize of CHEST_PRIZES) {
    if (prize.tier === tier) break
    before += prize.weight
  }

  // A hair inside the band, so rounding never lands it on the one before.
  return before / total + 1e-9
}

describe('what a chest can hold', () => {
  it('names every tier once, poorest first', () => {
    expect(CHEST_PRIZES.map((prize) => prize.tier)).toEqual(CHEST_TIERS)
  })

  it('gives every tier a chance of coming up', () => {
    for (const prize of CHEST_PRIZES) {
      expect(prize.weight).toBeGreaterThan(0)
    }
  })

  it('pays a share of the jackpot and never more than the whole of it', () => {
    for (const prize of CHEST_PRIZES) {
      expect(prize.low).toBeGreaterThan(0)
      expect(prize.low).toBeLessThanOrEqual(prize.high)
      expect(prize.high).toBeLessThanOrEqual(1)
    }
  })

  it('pays more for a richer tier, with no two bands overlapping', () => {
    for (const [index, prize] of CHEST_PRIZES.entries()) {
      if (index === 0) continue
      expect(prize.low).toBeGreaterThan(CHEST_PRIZES[index - 1].high)
    }
  })

  it('is worth about a quarter of the jackpot an opening, so a cleared day is worth clearing', () => {
    const total = CHEST_PRIZES.reduce((sum, prize) => sum + prize.weight, 0)
    const expected = CHEST_PRIZES.reduce(
      (sum, prize) => sum + (prize.weight / total) * ((prize.low + prize.high) / 2),
      0,
    )

    expect(expected).toBeGreaterThan(0.22)
    expect(expected).toBeLessThan(0.32)
  })
})

describe('opening one', () => {
  it('lands on the tier the first draw picks', () => {
    for (const tier of CHEST_TIERS) {
      expect(openChest(100, rolls(tierRoll(tier), 0.5)).tier).toBe(tier)
    }
  })

  it('pays the bottom of the tier on a low second draw and the top on a high one', () => {
    const prize = CHEST_PRIZES.find((one) => one.tier === 'handful')
    expect(prize).toBeDefined()
    if (prize === undefined) return

    expect(openChest(200, rolls(tierRoll('handful'), 0)).points).toBe(Math.round(prize.low * 200))
    expect(openChest(200, rolls(tierRoll('handful'), 1)).points).toBe(Math.round(prize.high * 200))
  })

  it('pays the whole jackpot on a jackpot (CHST-10)', () => {
    expect(openChest(120, rolls(tierRoll('jackpot'), 0.5))).toEqual({ tier: 'jackpot', points: 120, jackpot: 120 })
  })

  it('says what it was playing for', () => {
    expect(openChest(42, rolls(0.5, 0.5)).jackpot).toBe(42)
  })

  it('reads two draws whatever comes up, so a stubbed pair is a known opening', () => {
    const random = rolls(tierRoll('jackpot'), 0.5, tierRoll('pinch'), 0)
    expect(openChest(100, random).tier).toBe('jackpot')
    expect(openChest(100, random).tier).toBe('pinch')
  })

  it('is never empty, however small the jackpot', () => {
    for (const tier of CHEST_TIERS) {
      for (const inside of [0, 0.5, 1]) {
        const opened = openChest(MIN_CHEST_POINTS, rolls(tierRoll(tier), inside))
        expect(opened.points).toBe(MIN_CHEST_POINTS)
      }
    }
  })

  it('never pays more than the jackpot, down to a jackpot of 1', () => {
    expect(chestPoints(1, 1)).toBe(1)
    expect(chestPoints(0.04, 1)).toBe(1)
    expect(chestPoints(1.5, 10)).toBe(10)
  })

  it('draws every tier over many openings and no tier that is not on the table', () => {
    const seen = new Set<ChestTier>()
    let roll = 0

    for (let count = 0; count < 2000; count++) {
      roll = (roll + 0.0137) % 1
      seen.add(openChest(100, rolls(roll, 0.5)).tier)
    }

    expect([...seen].sort()).toEqual([...CHEST_TIERS].sort())
  })
})

describe('what the key plays for', () => {
  it('offers both ways of working it out', () => {
    expect(CHEST_JACKPOTS).toEqual(['bestTask', 'typicalDay'])
  })

  it('plays for the heaviest task of today by default (CHST-7)', () => {
    expect(DEFAULT_CHEST.jackpot).toBe('bestTask')

    const entries = [earned('a', '2026-09-17', 8), earned('b', '2026-09-17', 25), earned('c', '2026-09-17', 3)]
    expect(chestJackpot(entries, settings(), THU_17)).toBe(25)
  })

  it('plays for exactly what that task was worth, however little (CHST-7, CHST-9)', () => {
    expect(chestJackpot([earned('a', '2026-09-17', 2)], settings(), THU_17)).toBe(2)
    expect(chestJackpot([earned('a', '2026-09-17', 1)], settings(), THU_17)).toBe(1)
  })

  it('reads only today for the heaviest task', () => {
    const entries = [earned('a', '2026-09-16', 400), earned('b', '2026-09-17', 9)]
    expect(chestJackpot(entries, settings(), THU_17)).toBe(9)
  })

  it('averages the last seven days for a typical day', () => {
    const entries = [
      earned('a', '2026-09-17', 10),
      earned('b', '2026-09-16', 20),
      earned('c', '2026-09-11', 40),
    ]

    expect(chestJackpot(entries, settings({ jackpot: 'typicalDay' }), THU_17)).toBe(Math.round(70 / TYPICAL_DAYS))
  })

  it('leaves out what fell before the last seven days', () => {
    const entries = [earned('a', '2026-09-17', 70), earned('b', '2026-09-10', 700)]
    expect(chestJackpot(entries, settings({ jackpot: 'typicalDay' }), THU_17)).toBe(10)
  })

  it('counts what tasks earned and not what the app paid on top (CHST-8)', () => {
    const entries = [
      earned('a', '2026-09-17', 4),
      earned(BONUS_IDS.today, '2026-09-17', 500),
      earned(CHEST_ID, '2026-09-16', 900),
    ]

    expect(chestJackpot(entries, settings(), THU_17)).toBe(4)
    expect(chestJackpot(entries, settings({ jackpot: 'typicalDay' }), THU_17)).toBe(1)
  })

  it('plays for the least a chest gives on a day whose tasks earned nothing yet, never for nothing (CHST-9)', () => {
    expect(chestJackpot([], settings(), THU_17)).toBe(MIN_CHEST_POINTS)
    expect(chestJackpot([], settings({ jackpot: 'typicalDay' }), THU_17)).toBe(MIN_CHEST_POINTS)
  })

  it('never plays for more than a task can be worth', () => {
    const entries = [earned('a', '2026-09-17', 999), earned('b', '2026-09-17', 999)]
    expect(chestJackpot(entries, settings({ jackpot: 'typicalDay' }), THU_17)).toBeLessThanOrEqual(CHEST_MAX_JACKPOT)
    expect(chestJackpot([earned('a', '2026-09-17', 999)], settings(), THU_17)).toBe(CHEST_MAX_JACKPOT)
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
