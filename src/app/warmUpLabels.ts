import { WARM_UP_DAYS, type WarmUpProgress } from '../core'
import { describeDays } from './habitLabels'

/**
 * How a warm-up reads on screen. What it allows is derived in ../core/warmUp;
 * wording is presentation, so it stays here.
 */

/** "Day 3 of 30", for the Modes row, which has the room to say it in words. */
export function describeWarmUpDay({ day }: WarmUpProgress): string {
  return `Day ${String(day)} of ${String(WARM_UP_DAYS)}`
}

/** "Day 3/30": the same, as tight as the one-line panel wants it (WARM-6). */
export function describeWarmUpDayShort({ day }: WarmUpProgress): string {
  return `Day ${String(day)}/${String(WARM_UP_DAYS)}`
}

/**
 * "2/3 habits" — how many there are, over how many the day allows. The count is
 * never capped at the allowance: an account past it (WARM-7) reads "7/3 habits",
 * so every habit is seen to be counted and none to be taken away.
 */
export function describeAllowance({ used, allowed }: WarmUpProgress): string {
  return `${String(used)}/${String(allowed)} habits`
}

/** What is said when a habit is held back (WARM-8). */
export function describeHeldBack({ day, allowed, daysLeft }: WarmUpProgress): string {
  const kept = allowed === 1 ? '1 habit' : `${String(allowed)} habits`
  const then = daysLeft === 0 ? 'The warm-up is over tomorrow.' : 'Tomorrow allows one more.'
  return `Warming up: day ${String(day)} allows ${kept}. ${then}`
}

/** How long the warm-up has left, for the row that starts and ends it. */
export function describeDaysLeft({ daysLeft }: WarmUpProgress): string {
  return daysLeft === 0 ? 'Last day' : `${describeDays(daysLeft)} left`
}
