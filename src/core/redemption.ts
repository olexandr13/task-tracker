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
import type { TaskId } from './task'

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
  /**
   * The habit and the day these points were taken for skipping, where they were
   * not spent but lost (./penalty, HAB-34). Absent on points redeemed.
   */
  readonly skip?: SkippedDay
}

/** A habit's day passed over: what a skip's penalty is taken for. */
export interface SkippedDay {
  readonly taskId: TaskId
  readonly day: LocalDay
}

/** Whether these points were taken for skipping a habit rather than spent (HAB-34). */
export function isSkipPenalty(redemption: Redemption): boolean {
  return redemption.skip !== undefined
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
  /** Points spent on something. */
  readonly redeemed: number
  /** Points taken for skipping a habit (HAB-34): off the balance, but not spent on anything. */
  readonly lost: number
}

/**
 * Points earned, redeemed and lost to skips in each period: today, this week
 * (Monday to Sunday, as ./progress counts it), this month, this year, and all
 * time. An entry counts on the day it was earned for, a redemption on the local
 * day it was made — a skip's on the day skipped, which is when it is made out
 * for. Entries whose tasks are deleted still count: earned stays earned.
 */
export function rewardTotals(
  entries: readonly RewardEntry[],
  redemptions: readonly Redemption[],
  now: Date = new Date(),
): Record<RewardPeriod, PeriodPoints> {
  const redeemedDays = redemptions.map((redemption) => ({
    day: toLocalDay(new Date(redemption.redeemedAt)),
    points: redemption.points,
    lost: isSkipPenalty(redemption),
  }))

  function within(range: DayRange | null): PeriodPoints {
    const inRange = ({ day }: { day: LocalDay }) => range === null || (day >= range.from && day < range.to)
    const taken = redeemedDays.filter(inRange)
    return {
      earned: sumPoints(entries.filter(inRange)),
      redeemed: sumPoints(taken.filter((each) => !each.lost)),
      lost: sumPoints(taken.filter((each) => each.lost)),
    }
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

/**
 * One row of the ledger, whichever side it is: points a completion earned, or
 * points a redemption spent. The two are kept apart in storage — one is a day's
 * record, the other a record of its own — and put together here, since what a
 * person wants to see is one run of what happened to the points (RWD-38).
 */
export type LedgerRow =
  | { readonly kind: 'earned'; readonly day: LocalDay; readonly entry: RewardEntry }
  | { readonly kind: 'redeemed'; readonly day: LocalDay; readonly redemption: Redemption }

/**
 * Everything that happened to the points, **most recent day first**. Within a
 * day, what was spent comes before what was earned — a redemption carries a
 * time and an earning only its day, so there is no telling the order of the two
 * apart — and each side keeps the stable order it has on its own
 * (`earningHistory`, `redemptionHistory`).
 */
export function ledgerHistory(
  entries: readonly RewardEntry[],
  redemptions: readonly Redemption[],
): LedgerRow[] {
  const rows: LedgerRow[] = [
    ...redemptionHistory(redemptions).map(
      (redemption): LedgerRow => ({
        kind: 'redeemed',
        day: toLocalDay(new Date(redemption.redeemedAt)),
        redemption,
      }),
    ),
    ...earningHistory(entries).map((entry): LedgerRow => ({ kind: 'earned', day: entry.day, entry })),
  ]

  // A stable sort, so each side keeps the order it arrived in within a day.
  return rows.sort((a, b) => (a.day === b.day ? 0 : a.day < b.day ? 1 : -1))
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
