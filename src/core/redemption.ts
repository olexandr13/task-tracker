/**
 * Redeeming: spending earned points on something, and how the points stand.
 *
 * A redemption is a record of its own — so many points, and what they went on —
 * rather than anything a task knows about. The balance is derived: everything
 * earned (./reward) less everything redeemed, so nothing has to be kept in step
 * with it, and taking a completion back after spending its points shows a
 * balance below zero rather than rewriting what was spent.
 */

import { toLocalDay, type LocalDay } from './day'
import { periodRange } from './progress'
import type { RewardEntry } from './reward'

export type RedemptionId = string

/** The longest a note on what points went on can be. */
export const MAX_REDEMPTION_NOTE = 200

export interface Redemption {
  readonly id: RedemptionId
  readonly points: number
  /** What the points went on. Never empty. */
  readonly note: string
  /** ISO 8601 timestamp. */
  readonly redeemedAt: string
}

export class InvalidRedemptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRedemptionError'
  }
}

export class NotEnoughPointsError extends Error {
  constructor(points: number, balance: number) {
    super(`Cannot redeem ${String(points)} points with ${String(balance)} to spend.`)
    this.name = 'NotEnoughPointsError'
  }
}

/** Whether this many points can be redeemed at once, balance aside. */
export function isRedemptionAmount(points: number): boolean {
  return Number.isInteger(points) && points >= 1
}

/** Whether a note, once trimmed, can say what points went on: something, and not too much. */
export function isRedemptionNote(note: string): boolean {
  const trimmed = note.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_REDEMPTION_NOTE
}

/**
 * Spends `points` of the `balance` on what `note` says. Nothing can be spent
 * that has not been earned, so more than the balance is refused.
 */
export function createRedemption(points: number, note: string, balance: number, now: Date = new Date()): Redemption {
  if (!isRedemptionAmount(points)) {
    throw new InvalidRedemptionError(`${String(points)} is not a number of points to redeem: it must be a whole number from 1.`)
  }

  if (!isRedemptionNote(note)) {
    throw new InvalidRedemptionError(`A redemption says what it was for, in 1 to ${String(MAX_REDEMPTION_NOTE)} characters.`)
  }

  if (points > balance) {
    throw new NotEnoughPointsError(points, balance)
  }

  return { id: crypto.randomUUID(), points, note: note.trim(), redeemedAt: now.toISOString() }
}

/** Everything earned less everything redeemed. Below zero when a completion was taken back after its points were spent. */
export function pointsBalance(entries: readonly RewardEntry[], redemptions: readonly Redemption[]): number {
  return sumPoints(entries) - sumPoints(redemptions)
}

export type RewardPeriod = 'today' | 'week' | 'month' | 'year' | 'all'

export interface PeriodPoints {
  readonly earned: number
  readonly redeemed: number
}

/**
 * Points earned and redeemed in each period: today, this week (Monday to
 * Sunday, as ./progress counts it), this month, this year, and all time.
 * An entry counts on the day it was earned for, a redemption on the local day
 * it was made. Entries whose tasks are deleted still count: earned stays earned.
 */
export function rewardTotals(
  entries: readonly RewardEntry[],
  redemptions: readonly Redemption[],
  now: Date = new Date(),
): Record<RewardPeriod, PeriodPoints> {
  const redeemedDays = redemptions.map((redemption) => ({
    day: toLocalDay(new Date(redemption.redeemedAt)),
    points: redemption.points,
  }))

  function within(range: DayRange | null): PeriodPoints {
    const inRange = ({ day }: { day: LocalDay }) => range === null || (day >= range.from && day < range.to)
    return { earned: sumPoints(entries.filter(inRange)), redeemed: sumPoints(redeemedDays.filter(inRange)) }
  }

  const year = now.getFullYear()

  return {
    today: within(daysOf(periodRange('today', now))),
    week: within(daysOf(periodRange('week', now))),
    month: within(daysOf(periodRange('month', now))),
    year: within(daysOf({ start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })),
    all: within(null),
  }
}

/** The redemptions, most recent first. */
export function redemptionHistory(redemptions: readonly Redemption[]): Redemption[] {
  return [...redemptions].sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime())
}

/**
 * Completions that earned points, most recent day first. Same day keeps a
 * stable order by task id. Entries whose tasks are gone still belong here:
 * earned stays earned.
 */
export function earningHistory(entries: readonly RewardEntry[]): RewardEntry[] {
  return [...entries].sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? 1 : -1
    return a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0
  })
}

/** A period as local days: `from` included, `to` not. Days sort as text in date order. */
interface DayRange {
  readonly from: LocalDay
  readonly to: LocalDay
}

function daysOf(range: { start: Date; end: Date }): DayRange {
  return { from: toLocalDay(range.start), to: toLocalDay(range.end) }
}

function sumPoints(records: readonly { points: number }[]): number {
  return records.reduce((sum, record) => sum + record.points, 0)
}
