import { describe, expect, it } from 'vitest'
import {
  createRedemption,
  earningHistory,
  InvalidRedemptionError,
  ledgerHistory,
  MAX_REDEMPTION_NOTE,
  NotEnoughPointsError,
  pointsBalance,
  redemptionHistory,
  rewardTotals,
  type Redemption,
} from './redemption'
import type { RewardEntry } from './reward'

/*
 * RWD ids refer to wiki/rewards.md. Local dates on purpose: points count on local
 * days. September 2026 runs Mon 14 to Sun 20; Thu 17 is "now".
 */

const THU_17 = new Date(2026, 8, 17, 15, 0)

function entry(day: string, points: number, taskId = 'run'): RewardEntry {
  return { taskId, day, points }
}

function redeemed(at: Date, points: number, note = 'coffee'): Redemption {
  return { id: crypto.randomUUID(), points, note, redeemedAt: at.toISOString() }
}

describe('createRedemption (RWD-15, RWD-16)', () => {
  it('spends points on what the note says, trimmed, stamped now', () => {
    const redemption = createRedemption(3, '  coffee  ', 10, THU_17)

    expect(redemption.points).toBe(3)
    expect(redemption.note).toBe('coffee')
    expect(redemption.redeemedAt).toBe(THU_17.toISOString())
    expect(redemption.id).not.toBe(createRedemption(3, 'coffee', 10, THU_17).id)
  })

  it('takes whole numbers of points from 1', () => {
    for (const points of [0, -2, 1.5, Number.NaN]) {
      expect(() => createRedemption(points, 'coffee', 10, THU_17)).toThrow(InvalidRedemptionError)
    }
  })

  it('needs a note saying what for, and not too long a one', () => {
    expect(() => createRedemption(1, '   ', 10, THU_17)).toThrow(InvalidRedemptionError)
    expect(() => createRedemption(1, 'x'.repeat(MAX_REDEMPTION_NOTE + 1), 10, THU_17)).toThrow(InvalidRedemptionError)
    expect(createRedemption(1, 'x'.repeat(MAX_REDEMPTION_NOTE), 10, THU_17).note).toHaveLength(MAX_REDEMPTION_NOTE)
  })

  it('refuses to spend more than the balance, and allows all of it', () => {
    expect(() => createRedemption(11, 'coffee', 10, THU_17)).toThrow(NotEnoughPointsError)
    expect(createRedemption(10, 'coffee', 10, THU_17).points).toBe(10)
  })
})

describe('pointsBalance (RWD-17)', () => {
  it('is everything earned less everything redeemed', () => {
    expect(pointsBalance([entry('2026-09-14', 5), entry('2026-09-15', 3)], [redeemed(THU_17, 6)])).toBe(2)
    expect(pointsBalance([], [])).toBe(0)
  })

  it('goes below zero when what was spent is taken back', () => {
    expect(pointsBalance([], [redeemed(THU_17, 4)])).toBe(-4)
  })
})

describe('rewardTotals (RWD-21)', () => {
  const entries = [
    entry('2025-12-31', 100),
    entry('2026-08-31', 50),
    entry('2026-09-13', 20),
    entry('2026-09-14', 7),
    entry('2026-09-17', 2),
    entry('2026-09-17', 1, 'read'),
  ]

  it('counts what was earned today, this week from Monday, this month, this year and all time', () => {
    const totals = rewardTotals(entries, [], THU_17)

    expect(totals.today.earned).toBe(3)
    expect(totals.week.earned).toBe(10)
    expect(totals.month.earned).toBe(30)
    expect(totals.year.earned).toBe(80)
    expect(totals.all.earned).toBe(180)
  })

  it('counts what was redeemed on the local day it was redeemed', () => {
    const totals = rewardTotals(
      [],
      [redeemed(new Date(2026, 8, 17, 0, 5), 4), redeemed(new Date(2026, 8, 13, 23, 55), 6), redeemed(new Date(2025, 11, 31, 12), 1)],
      THU_17,
    )

    expect(totals.today).toEqual({ earned: 0, redeemed: 4 })
    expect(totals.week.redeemed).toBe(4)
    expect(totals.month.redeemed).toBe(10)
    expect(totals.year.redeemed).toBe(10)
    expect(totals.all.redeemed).toBe(11)
  })

  it('is all zero with nothing earned or redeemed', () => {
    expect(rewardTotals([], [], THU_17).all).toEqual({ earned: 0, redeemed: 0 })
  })
})

describe('redemptionHistory (RWD-18)', () => {
  it('lists the most recent first', () => {
    const older = redeemed(new Date(2026, 8, 14), 1, 'older')
    const newer = redeemed(new Date(2026, 8, 16), 1, 'newer')

    expect(redemptionHistory([older, newer]).map((redemption) => redemption.note)).toEqual(['newer', 'older'])
  })
})

describe('earningHistory (RWD-23)', () => {
  it('lists the most recent day first, and same day by task id', () => {
    const older = entry('2026-09-14', 5, 'run')
    const newerA = entry('2026-09-17', 2, 'read')
    const newerB = entry('2026-09-17', 1, 'write')

    expect(earningHistory([older, newerB, newerA]).map((e) => e.taskId)).toEqual(['read', 'write', 'run'])
  })
})

describe('everything that happened to the points (RWD-38)', () => {
  const EARNED: RewardEntry[] = [
    { taskId: 'run', day: '2026-09-17', points: 5 },
    { taskId: 'read', day: '2026-09-15', points: 2 },
  ]
  const SPENT: Redemption[] = [
    { id: 'coffee', points: 3, note: 'Coffee', redeemedAt: '2026-09-17T12:00:00.000Z' },
    { id: 'film', points: 8, note: 'A film', redeemedAt: '2026-09-16T20:00:00.000Z' },
  ]

  it('is one run of both sides, most recent day first', () => {
    expect(ledgerHistory(EARNED, SPENT).map((row) => [row.day, row.kind])).toEqual([
      ['2026-09-17', 'redeemed'],
      ['2026-09-17', 'earned'],
      ['2026-09-16', 'redeemed'],
      ['2026-09-15', 'earned'],
    ])
  })

  it('carries each row whole, so it can say what it was for and what it was worth', () => {
    const [spent, earned] = ledgerHistory(EARNED, SPENT)

    expect(spent.kind === 'redeemed' && spent.redemption.note).toBe('Coffee')
    expect(earned.kind === 'earned' && earned.entry.points).toBe(5)
  })

  it('is empty when nothing has happened at all', () => {
    expect(ledgerHistory([], [])).toEqual([])
  })
})
