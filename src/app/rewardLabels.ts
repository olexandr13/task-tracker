import { toLocalDay, type LocalDay } from '../core'
import { describeDueDate } from './dueLabels'

/**
 * How points read on screen. The rules for earning and spending them live in
 * ../core; wording is presentation, so it stays here.
 */

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

/** The day a completion earned its points: Today, Yesterday, or a short date. */
export function describeEarnedOn(day: LocalDay, now: Date): string {
  return describeDueDate(day, now)
}
