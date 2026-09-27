import { WARM_UP_DAYS, type WarmUpProgress } from '../core'
import { describeDays } from './habitLabels'

/**
 * How a warm-up reads on screen. What it allows is derived in ../core/warmUp;
 * wording is presentation, so it stays here.
 */

/** "Day 3 of 30". */
export function describeWarmUpDay({ day }: WarmUpProgress): string {
  return `Day ${String(day)} of ${String(WARM_UP_DAYS)}`
}

/**
 * "2 habits · 3 allowed today" — what there is, beside what the day allows.
 * Read this way round rather than as "2 of 3", which turns clumsy the moment
 * there are more habits than the day allows (WARM-7): "5 of 1 habit".
 */
export function describeAllowance({ used, allowed }: WarmUpProgress): string {
  const habits = used === 1 ? '1 habit' : `${String(used)} habits`
  return `${habits} · ${String(allowed)} allowed today`
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
