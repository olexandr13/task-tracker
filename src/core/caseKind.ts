/**
 * How a range can be spread, for the reel (CHST-15).
 *
 * The cases a person opens do not pick among these. Each has its own least and
 * most (`caseSpan` in ./cases) and pays any whole number inside that, which is
 * the fair draw. The other two shapes stay so a reel can still be built from
 * them:
 *
 * - **Steady** pays the nearest whole number to the average of 1 and the
 *   jackpot, rounding a halfway average up. The amount is known before it opens.
 * - **Fair** pays any whole number from 1 to the jackpot, each as likely as
 *   any other — `openFairCase`.
 * - **Toss** pays either 1 or the whole jackpot, one chance in two.
 *
 * Where the jackpot is 1 the three meet, and each pays 1.
 */

import { DROP_LEAST, MIN_CASE_POINTS, openFairCase, type CaseOpen, type CaseSource, type CaseSpan } from './cases'

/** The cases, safest first. Fair is the one chosen to begin with. */
export const CASE_KINDS = ['steady', 'fair', 'toss'] as const

export type CaseKindId = (typeof CASE_KINDS)[number]

/**
 * How each case spreads the range `caseSpan` gives it. Today, the daily case
 * and Weekly each pay any whole number from their least to their most,
 * each as likely as any other. The ends are not this kind's: Today's least is
 * the cheapest task today, the daily case's range is yesterday's and starts at
 * 0, and Weekly's ends are last week's.
 */
export const CASE_FOR_SOURCE = { today: 'fair', daily: 'fair', week: 'fair' } as const satisfies Record<CaseSource, CaseKindId>

/** How a case's possible win is said: one amount, a span, or one or the other. */
export type CaseShape = 'exact' | 'span' | 'either'

/** What a case can give, for the line in front of it. */
export interface CaseOdds {
  readonly shape: CaseShape
  readonly least: number
  readonly most: number
}

/** The line in front of a case, from the range it can pay. Only the Drop's starts at 0 (CHST-11). */
export function oddsForSpan(span: CaseSpan): CaseOdds {
  const least = Math.max(DROP_LEAST, Math.floor(span.least))
  const most = Math.max(least, Math.floor(span.most))
  return least === most ? { shape: 'exact', least, most } : { shape: 'span', least, most }
}

/** The jackpot a case plays for: a whole number, and never under 1. */
function stake(jackpot: number): number {
  return Math.max(MIN_CASE_POINTS, Math.floor(jackpot))
}

/**
 * What Steady pays: the nearest whole number to the average of 1 and the
 * jackpot. A halfway average rounds up.
 */
export function steadyPoints(jackpot: number): number {
  const most = stake(jackpot)
  return Math.max(MIN_CASE_POINTS, Math.round((MIN_CASE_POINTS + most) / 2))
}

/** What one case can give, from the jackpot as it stands. */
export function caseOdds(id: CaseKindId, jackpot: number): CaseOdds {
  const most = stake(jackpot)

  if (id === 'steady') {
    const points = steadyPoints(most)
    return { shape: 'exact', least: points, most: points }
  }

  if (most === MIN_CASE_POINTS) return { shape: 'exact', least: MIN_CASE_POINTS, most: MIN_CASE_POINTS }
  if (id === 'toss') return { shape: 'either', least: MIN_CASE_POINTS, most }
  return { shape: 'span', least: MIN_CASE_POINTS, most }
}

/**
 * Opens one case. `random` is injectable so a test can say what it gets.
 * Fair is `openFairCase`; the jackpot on the result is the day's, so a card's
 * colour is still which quarter of the day the points came to.
 */
export function openCase(id: CaseKindId, jackpot: number, random: () => number = Math.random): CaseOpen {
  const most = stake(jackpot)
  if (id === 'fair') return openFairCase(most, random)
  if (id === 'steady') return { points: steadyPoints(most), jackpot: most }

  const points = most === MIN_CASE_POINTS || random() < 0.5 ? MIN_CASE_POINTS : most
  return { points, jackpot: most }
}
