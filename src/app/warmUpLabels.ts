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

/**
 * What the warm-up has to say about today: how many more can be taken on, that
 * there is no room for another one, or — for an account that already keeps more
 * habits than the day allows (WARM-7) — that the days have yet to catch up.
 * That case says in so many words that no habit is taken away, which is the
 * fear a limit raises; "none of them goes anywhere" said it in a way that could
 * be read either way. With nothing left for today it spells the rule out — one
 * new habit a day — rather than reporting the day's allowance as filled, which
 * said nothing about when the next one can be added. On the last day of all
 * there is no tomorrow to promise one more, so it says what happens instead.
 */
export function describeRemaining({ used, allowed, remaining, daysLeft }: WarmUpProgress): string {
  if (remaining === 1) return 'One more habit can be taken on today.'
  if (remaining > 1) return `${String(remaining)} more habits can be taken on today.`

  const next =
    daysLeft === 0
      ? 'From tomorrow there is no limit.'
      : 'The warm-up allows one new habit a day, so tomorrow allows one more.'
  return used > allowed
    ? `You have more habits than today allows, so no new one today. None of the habits you have is removed. ${next}`
    : `No new habit today. ${next}`
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
