import { bonusPeriod, moneyFor, toLocalDay, type LocalDay, type Period, type PointValue, type TaskId } from '../core'
import { describeDueDate } from './dueLabels'

/**
 * How points read on screen. The rules for earning and spending them live in
 * ../core; wording is presentation, so it stays here.
 */

/** What each period's bonus reads as, where a task's title would be (RWD-28). */
export const BONUS_TITLES: Record<Period, string> = {
  today: 'All of Today done',
  week: 'All of this week done',
  month: 'All of this month done',
}

/** What each period is called in a sentence about it: `clearing This week`. */
export const PERIOD_NAMES: Record<Period, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
}

/** What each period's bonus is called where it is set, and on the tiles (RWD-30). */
export const BONUS_LABELS: Record<Period, string> = {
  today: `${PERIOD_NAMES.today} cleared`,
  week: `${PERIOD_NAMES.week} cleared`,
  month: `${PERIOD_NAMES.month} cleared`,
}

/** What each bonus is for, said in full under its name. */
export const BONUS_HINTS: Record<Period, string> = {
  today: 'Earned once a day, the moment everything in Today is done.',
  week: 'Earned once a week, the moment everything this week asks for is done.',
  month: 'Earned once a month, the moment everything this month asks for is done.',
}

/** The title a ledger row carries: the task's, or what the bonus was for (RWD-28). */
export function describeEarningTitle(taskId: TaskId, taskTitles: ReadonlyMap<TaskId, string>): string {
  const period = bonusPeriod(taskId)
  if (period !== null) return BONUS_TITLES[period]
  return taskTitles.get(taskId) ?? 'Deleted task'
}

/** `1 point`, `5 points`, `-3 points`. */
export function describePoints(points: number): string {
  return `${String(points)} ${Math.abs(points) === 1 ? 'point' : 'points'}`
}

/** What a completion earns, as a row spells it out under its star: `+5`. */
export function describeReward(points: number): string {
  return `+${String(points)}`
}

/** The day something was redeemed: Today, Yesterday, or a short date, as a due date reads. */
export function describeRedeemedAt(redeemedAt: string, now: Date): string {
  return describeDueDate(toLocalDay(new Date(redeemedAt)), now)
}

/** The day a wish was bought: `Bought today`, `Bought 12 Sep` (RWD-40). */
export function describeBoughtOn(boughtAt: string, now: Date): string {
  const day = describeDueDate(toLocalDay(new Date(boughtAt)), now)
  return `Bought ${day.toLowerCase()}`
}

/** The day a completion earned its points: Today, Yesterday, or a short date. */
export function describeEarnedOn(day: LocalDay, now: Date): string {
  return describeDueDate(day, now)
}

/**
 * What this many points come to in money: `25 UAH`, `0.21 UAH`. Null while
 * nothing says what a point is worth, which is where the money is left unsaid
 * rather than shown as nothing (RWD-32). Pennies are only spelled out when
 * there are any.
 */
export function describeMoney(points: number, value: PointValue | null): string | null {
  const money = moneyFor(points, value)
  if (money === null || value === null) return null
  return `${Number.isInteger(money) ? String(money) : money.toFixed(2)} ${value.currency}`
}

/** The rate itself, as the rules page says it: `1 point = 2.50 UAH`. */
export function describePointValue(value: PointValue): string {
  return `1 point = ${describeMoney(1, value) ?? ''}`
}
