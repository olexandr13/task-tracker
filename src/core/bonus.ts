/**
 * Period bonuses: points for clearing **Today**, **this week** or **this
 * month**, on top of what each task earns.
 *
 * A task's reward pays for the task; these pay for the stretch of time. Each is
 * one amount for the whole account rather than anything a task carries, and
 * what one earns goes into the same ledger as every other completion
 * (./reward), under an id of its own per period — so a bonus counts towards the
 * period tiles, can be taken off a day, and stays earned whatever becomes of
 * the tasks that earned it.
 *
 * Whether a period is clear is not stored either: it is the question the
 * progress bars already answer (./progress), asked of the tasks as they stand. A
 * change that leaves a period clear earns its bonus, on the day of the change;
 * one that leaves it unclear again takes that bonus back, wherever in the period
 * it was earned, as taking a completion back does.
 */

import { toLocalDay, type LocalDay } from './day'
import { periodRange, summarize, type Period } from './progress'
import type { RewardChanges, RewardEntry, RewardKey } from './reward'
import type { Task, TaskId } from './task'

/** The periods a bonus can be set for: the three the bars count (PROG-1). */
export const BONUS_PERIODS: readonly Period[] = ['today', 'week', 'month']

/**
 * What each period's bonus is recorded under in place of a task. Tasks are named
 * by `crypto.randomUUID()`, so these are no task's id and never will be.
 */
export const BONUS_IDS: Readonly<Record<Period, TaskId>> = {
  today: 'today-bonus',
  week: 'week-bonus',
  month: 'month-bonus',
}

/** What a first bonus stepped up from none is worth: a longer stretch asks more. */
export const DEFAULT_BONUS: Readonly<Record<Period, number>> = { today: 5, week: 20, month: 50 }

/** What clearing each period earns, null where it earns nothing. */
export type PeriodBonuses = Readonly<Record<Period, number | null>>

/** No bonus set for any period: what an account starts with. */
export const NO_BONUSES: PeriodBonuses = { today: null, week: null, month: null }

/** The period whose bonus this entry is, or null for a task's own completion. */
export function bonusPeriod(taskId: TaskId): Period | null {
  return BONUS_PERIODS.find((period) => BONUS_IDS[period] === taskId) ?? null
}

export function isBonus(taskId: TaskId): boolean {
  return bonusPeriod(taskId) !== null
}

/**
 * Whether everything the period asks for is done — the moment its bar reads
 * 100% (PROG-3, RWD-25). A period with nothing in it is not cleared: there was
 * nothing to clear.
 */
export function isPeriodCleared(tasks: readonly Task[], period: Period, now: Date = new Date()): boolean {
  const { total, remaining } = summarize(tasks, period, now)
  return total > 0 && remaining === 0
}

/**
 * `changes`, plus what a change to the tasks did to each period's bonus: earned
 * where it left the period clear, taken back where it left it unclear again. A
 * period that was clear either way changes nothing, so a bonus is earned once a
 * period however many tasks are finished after it. Taking back takes the whole
 * of what the period was given, whatever the bonus is now, as with a task's
 * reward (RWD-11).
 *
 * A bonus is earned **on the day the period came clear**, which for the week and
 * the month is any day inside it — so taking it back is finding what that period
 * was given, among `earned`, rather than assuming today. Nothing found is
 * nothing to take back.
 *
 * With no bonus set for a period, nothing of its is touched at all: there is
 * nothing to earn, and what it earned while there was a bonus stays earned, as
 * when a task's reward is taken away (RWD-3, RWD-13).
 *
 * Only the period `now` falls in is ever reached: an earlier week or month is
 * done with.
 */
export function withPeriodBonuses(
  changes: RewardChanges,
  before: readonly Task[],
  after: readonly Task[],
  bonuses: PeriodBonuses,
  earned: readonly RewardEntry[] = [],
  now: Date = new Date(),
): RewardChanges {
  const gained: RewardEntry[] = [...changes.earned]
  const revoked: RewardKey[] = [...changes.revoked]
  const day = toLocalDay(now)

  for (const period of BONUS_PERIODS) {
    const bonus = bonuses[period]
    if (bonus === null) continue

    const was = isPeriodCleared(before, period, now)
    const is = isPeriodCleared(after, period, now)
    if (was === is) continue

    const taskId = BONUS_IDS[period]
    if (is) {
      gained.push({ taskId, day, points: bonus })
      continue
    }

    for (const given of earned) {
      if (given.taskId === taskId && isWithinPeriod(given.day, period, now)) {
        revoked.push({ taskId, day: given.day })
      }
    }
  }

  return { earned: gained, revoked }
}

/**
 * What the period's bonus has earned in the period `now` falls in, or null where
 * it has earned nothing yet — either because the period is not clear, or because
 * no bonus was set when it came clear. How the points stand reads this to say
 * which bonuses a period still has to give (RWD-30).
 */
export function bonusEarned(
  entries: readonly RewardEntry[],
  period: Period,
  now: Date = new Date(),
): RewardEntry | null {
  const taskId = BONUS_IDS[period]
  return entries.find((entry) => entry.taskId === taskId && isWithinPeriod(entry.day, period, now)) ?? null
}

/** Whether the day falls in the period `now` is in. Days sort as text in date order. */
function isWithinPeriod(day: LocalDay, period: Period, now: Date): boolean {
  const { start, end } = periodRange(period, now)
  return day >= toLocalDay(start) && day < toLocalDay(end)
}
