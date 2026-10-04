import { describe, expect, it } from 'vitest'
import { openFairCase } from './cases'
import { CASE_FOR_SOURCE, caseOdds, CASE_KINDS, oddsForSpan, openCase, steadyPoints, type CaseKindId } from './caseKind'

/* The three cases. CHST ids refer to wiki/cases.md. */

/** A roll of each number in turn, so a draw is exactly what a test asked for. */
function rolls(...numbers: readonly number[]): () => number {
  let next = 0
  return () => numbers[next++] ?? 0
}

describe('what each case can give', () => {
  it('lists the three, safest first, with Fair in the middle (CHST-28)', () => {
    expect(CASE_KINDS).toEqual(['steady', 'fair', 'toss'])
  })

  it('pays Steady the nearest whole number to the average, rounding a tie up', () => {
    expect(steadyPoints(25)).toBe(13)
    expect(steadyPoints(24)).toBe(13)
    expect(steadyPoints(80)).toBe(41)
    expect(steadyPoints(1)).toBe(1)
    expect(steadyPoints(0)).toBe(1)
  })

  it('says each case’s spread, and that they meet when the jackpot is 1', () => {
    expect(caseOdds('steady', 25)).toEqual({ shape: 'exact', least: 13, most: 13 })
    expect(caseOdds('fair', 25)).toEqual({ shape: 'span', least: 1, most: 25 })
    expect(caseOdds('toss', 25)).toEqual({ shape: 'either', least: 1, most: 25 })

    for (const id of CASE_KINDS) {
      expect(caseOdds(id, 1)).toEqual({ shape: 'exact', least: 1, most: 1 })
    }
  })

  it('says a case’s own range, one amount where the ends meet', () => {
    expect(oddsForSpan({ least: 4, most: 20 })).toEqual({ shape: 'span', least: 4, most: 20 })
    expect(oddsForSpan({ least: 9, most: 9 })).toEqual({ shape: 'exact', least: 9, most: 9 })
    expect(oddsForSpan({ least: 1, most: 1 })).toEqual({ shape: 'exact', least: 1, most: 1 })
  })
})

describe('opening a case', () => {
  it('opens Fair as Cases always has: any amount, each as likely (CHST-10)', () => {
    expect(openCase('fair', 40, rolls(0.5))).toEqual(openFairCase(40, rolls(0.5)))
    expect(openCase('fair', 80, rolls(0)).points).toBe(1)
    expect(openCase('fair', 80, rolls(0.999999)).points).toBe(80)
  })

  it('opens Steady for the known half, whatever the roll', () => {
    expect(openCase('steady', 25, rolls(0))).toEqual({ points: 13, jackpot: 25 })
    expect(openCase('steady', 25, rolls(0.99))).toEqual({ points: 13, jackpot: 25 })
  })

  it('draws every source as a fair span across the jackpot it is handed (CHST-10)', () => {
    expect(CASE_FOR_SOURCE).toEqual({ today: 'fair', daily: 'fair', week: 'fair' })
    expect(caseOdds(CASE_FOR_SOURCE.daily, 101)).toEqual({ shape: 'span', least: 1, most: 101 })
    expect(openCase(CASE_FOR_SOURCE.daily, 101, rolls(0)).points).toBe(1)
    expect(openCase(CASE_FOR_SOURCE.daily, 101, rolls(0.5)).points).toBe(51)
    expect(openCase(CASE_FOR_SOURCE.daily, 101, rolls(0.999999)).points).toBe(101)
  })

  it('opens Toss for 1 or the whole jackpot, one chance in two (CHST-28)', () => {
    expect(openCase('toss', 40, rolls(0))).toEqual({ points: 1, jackpot: 40 })
    expect(openCase('toss', 40, rolls(0.49))).toEqual({ points: 1, jackpot: 40 })
    expect(openCase('toss', 40, rolls(0.5))).toEqual({ points: 40, jackpot: 40 })
  })

  it('pays 1 from every case when there is nothing to play for (CHST-11)', () => {
    for (const id of CASE_KINDS) {
      expect(openCase(id, 1, rolls(0.99))).toEqual({ points: 1, jackpot: 1 })
      expect(openCase(id, 0, rolls(0))).toEqual({ points: 1, jackpot: 1 })
    }
  })

  it('never pays outside what that case said it could', () => {
    const jackpot = 30
    const ids: readonly CaseKindId[] = CASE_KINDS

    for (const id of ids) {
      const odds = caseOdds(id, jackpot)
      for (let run = 0; run < 200; run++) {
        const { points } = openCase(id, jackpot)
        expect(points).toBeGreaterThanOrEqual(odds.least)
        expect(points).toBeLessThanOrEqual(odds.most)
        if (odds.shape === 'either') expect(points === odds.least || points === odds.most).toBe(true)
        if (odds.shape === 'exact') expect(points).toBe(odds.least)
      }
    }
  })
})
