/**
 * Cases: what a cleared day is worth when the amount is a surprise (CHST-1).
 *
 * A task's reward pays a known amount for a known piece of work, and a period
 * bonus (./bonus) pays a known amount for clearing a stretch of it. This pays an
 * **unknown** amount inside a range of its own. Payday pays from the
 * cheapest task finished today up to half of everything earned today. The
 * Drop pays from 1 up to everything earned yesterday divided by how
 * many tasks that was. Weekly, ready on Monday and planned until then, pays
 * from the cheapest task finished last week up to everything earned last week
 * divided by how many tasks that was. Inside a range, every whole number is as likely as any
 * other (`openSpan`). Finishing the day is worth coming back to rather than
 * worth a number already known before the day began.
 *
 * Clearing Today earns one **key**, and the key opens one case. Like a bonus,
 * what a case gives rides in the same ledger as every completion (./reward),
 * under an id of its own — so it counts towards the balance and the period
 * tiles, shows among the earnings, and stays earned whatever becomes of the
 * tasks that earned it. The ledger names an entry by its task and its day, so
 * that id and the day are together the record of Cases being opened: one a
 * day, counted once however many devices saw it.
 *
 * Nothing here is stored but the settings. Whether a key is waiting is
 * derived from the tasks as they stand and the ledger as it stands, the same
 * question the progress bars already answer (./progress).
 */

import { isBonus } from './bonus'
import { offsetDay, toLocalDay, type LocalDay } from './day'
import { periodRange, summarize } from './progress'
import { completionDays, type RewardEntry } from './reward'
import type { Task, TaskId } from './task'
import { liveTasks } from './trash'
import { dailyCaseOpened, dailyKeyTime, todayCaseOpened, weekCaseOpened } from './caseKey'

/** What one opening gave. */
export interface CaseOpen {
  /** What it paid: a whole number of points, from the least to the most. */
  readonly points: number
  /** The most this case could pay, as it stood when it was opened. */
  readonly jackpot: number
  /**
   * The least this case could pay: 0 for the Drop (CHST-11). Absent means 1,
   * which is what a draw from 1 up to the jackpot uses.
   */
  readonly least?: number
}

/** The whole-number range one case can pay. `least` is never above `most`. */
export interface CaseSpan {
  readonly least: number
  readonly most: number
}

/**
 * The least Payday and Weekly can pay (CHST-11) — and so also the least the
 * jackpot itself can be (CHST-9). The Drop is the one case that can be empty:
 * it runs from `DROP_LEAST`.
 */
export const MIN_CASE_POINTS = 1

/** The least the Drop pays: it can come up empty (CHST-11). */
export const DROP_LEAST = 0

/**
 * What an opening is recorded under in place of a task, as a bonus is
 * (`BONUS_IDS`). Tasks are named by `crypto.randomUUID()`, so this is no task's
 * id and never will be. The id stays `chest-open`, the name it was first
 * written under, so a row already in the ledger is still this opening.
 */
export const CASE_TODAY_ID: TaskId = 'chest-open'

/**
 * The case that arrives at a random moment, recorded apart from the one Today
 * earns. The id stays `chest-daily` so an opening already written still counts.
 */
export const CASE_DAILY_ID: TaskId = 'chest-daily'

/** Weekly, the case Monday brings, recorded apart from the other two. */
export const CASE_WEEK_ID: TaskId = 'chest-week'

/** Whether a ledger row is a case opening, rather than a task or a bonus. */
export function isCaseEarning(taskId: TaskId): boolean {
  return taskId === CASE_TODAY_ID || taskId === CASE_DAILY_ID || taskId === CASE_WEEK_ID
}

/** What a day has to be before it earns a key, and what the cases count. */
export interface CaseSettings {
  /**
   * How many tasks the day has to have asked for. A day with fewer earns no key
   * however clear it is, so a single thing remembered at nine in the evening is
   * not a day's work.
   */
  readonly leastTasks: number
  /**
   * Whether a task finished without points adds 1 to the most each case pays
   * (CHST-32). Off, the cases are worked out from tasks with points alone.
   */
  readonly countUnpaid: boolean
}

export const MIN_LEAST_TASKS = 1
export const MAX_LEAST_TASKS = 99

/** What an account starts with: any cleared day earns a key, and every task done counts. */
export const DEFAULT_CASES: CaseSettings = { leastTasks: MIN_LEAST_TASKS, countUnpaid: true }

/** Whether a day can be asked for this many tasks before it earns a key. */
export function isLeastTasks(tasks: number): boolean {
  return Number.isInteger(tasks) && tasks >= MIN_LEAST_TASKS && tasks <= MAX_LEAST_TASKS
}

/** Why there is no case to open just now, or null while one is ready. */
export type CaseBlock = 'opened' | 'unclear' | 'tooSmall' | 'bonusWaiting'

/** Where a case comes from: clearing Today, the moment that arrives on its own, or the week. */
export type CaseSource = 'today' | 'daily' | 'week'

const CASE_ID_FOR_SOURCE = {
  today: CASE_TODAY_ID,
  daily: CASE_DAILY_ID,
  week: CASE_WEEK_ID,
} as const satisfies Record<CaseSource, TaskId>

/** The ledger id an opening of this case is written under. */
export function caseIdFor(source: CaseSource): TaskId {
  return CASE_ID_FOR_SOURCE[source]
}

/**
 * A case for this day. An opened one stays until the day ends, then it is gone:
 * yesterday's opening is not this morning's case (CHST-28).
 */
export interface CaseSlot {
  readonly source: CaseSource
  /** `ready` can be opened. `waiting` is planned, and not yet. `opened` has had its lid up today. */
  readonly state: 'ready' | 'waiting' | 'opened'
  /**
   * When a waiting case arrives on its own: the Drop at its moment today, Weekly
   * at midnight on the coming Monday (CHST-29, CHST-30). Payday has no clock,
   * being earned rather than waited for, and neither has a case ready or opened.
   */
  readonly at: Date | null
  /** How many more tasks Today needs finished before a waiting Payday is ready (CHST-31). */
  readonly tasksLeft?: number
}

/**
 * The cases in front of someone today (CHST-28, CHST-30). Today's is planned
 * while the day has work left on it, counting the tasks still to finish
 * (CHST-31), and ready once that work is done. The daily case is planned until
 * the account's moment for it (CHST-29), then ready. Weekly is planned until Monday, counting down to its
 * midnight, then ready from the start of that day. Each one stays, opened,
 * until the day ends. An empty day plans no Today case: there was nothing to
 * clear.
 */
export function caseSlots(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  accountId: string,
  now: Date = new Date(),
): CaseSlot[] {
  const slots: CaseSlot[] = []
  const { total, completed, remaining } = summarize(tasks, 'today', now)
  const dayCleared = total > 0 && remaining === 0 && total >= settings.leastTasks

  if (todayCaseOpened(entries, now)) slots.push({ source: 'today', state: 'opened', at: null })
  else if (dayCleared) slots.push({ source: 'today', state: 'ready', at: null })
  else if (total > 0 && remaining > 0) {
    // A day asking for fewer tasks than a case needs (CHST-3) is short of the ones still to add too.
    const tasksLeft = Math.max(remaining, settings.leastTasks - completed)
    slots.push({ source: 'today', state: 'waiting', at: null, tasksLeft })
  }

  if (dailyCaseOpened(entries, now)) slots.push({ source: 'daily', state: 'opened', at: null })
  else {
    const at = dailyKeyTime(toLocalDay(now), accountId)
    if (now.getTime() >= at.getTime()) slots.push({ source: 'daily', state: 'ready', at: null })
    else slots.push({ source: 'daily', state: 'waiting', at })
  }

  if (!isMonday(now)) slots.push({ source: 'week', state: 'waiting', at: nextShareAt(now) })
  else if (weekCaseOpened(entries, now)) slots.push({ source: 'week', state: 'opened', at: null })
  else slots.push({ source: 'week', state: 'ready', at: null })

  return slots
}

/** Monday, in the local calendar. Weeks run Monday to Sunday, as the rest of the app does. */
function isMonday(now: Date): boolean {
  return now.getDay() === 1
}

/**
 * When Weekly next becomes ready: local midnight on the coming Monday, or null
 * when today is already that Monday (CHST-30). It is ready from the start of
 * the day, so there is no hour to wait out once Monday has begun. Until then
 * it stays on the page, planned.
 */
export function nextShareAt(now: Date): Date | null {
  if (isMonday(now)) return null
  const monday = periodRange('week', now).start
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7)
}

/** The seven days of the week that closed before this one, Monday first. */
function daysOfPreviousWeek(now: Date): LocalDay[] {
  const start = offsetDay(toLocalDay(periodRange('week', now).start), -7)
  const days: LocalDay[] = []
  for (let index = 0; index < 7; index += 1) days.push(offsetDay(start, index))
  return days
}

/**
 * Opens a case for any whole number from 1 to the jackpot, every one of them
 * as likely as any other. `random` is injectable so a test can say what it
 * gets. A case with its own floor uses `openSpan`.
 */
export function openFairCase(jackpot: number, random: () => number = Math.random): CaseOpen {
  const most = Math.max(MIN_CASE_POINTS, Math.floor(jackpot))
  const points = Math.min(most, MIN_CASE_POINTS + Math.floor(random() * (most - MIN_CASE_POINTS + 1)))

  return { points, jackpot: most }
}

/**
 * Opens a case for any whole number from `least` to `most`, each as likely as
 * any other (CHST-10). The result's jackpot is that most, so a card's colour
 * is still which quarter of the case the points came to. Never under 0: only
 * the Drop's range starts there (CHST-11).
 */
export function openSpan(span: CaseSpan, random: () => number = Math.random): CaseOpen {
  const least = Math.max(DROP_LEAST, Math.floor(span.least))
  const most = Math.max(least, Math.floor(span.most))
  const points = least + Math.floor(random() * (most - least + 1))

  return { points, jackpot: most, least }
}

/**
 * The numbers one case's range is worked out from (CHST-10). `span` is what
 * the case then pays.
 */
export type CaseWorking = TodayWorking | DailyWorking | WeekWorking

/** Payday: the cheapest task today, half of everything earned today, and the tasks that earned nothing. */
export interface TodayWorking {
  readonly source: 'today'
  /** Points of the cheapest task finished today, or null when today has no task with points. */
  readonly cheapest: number | null
  /** Everything earned today, cases left out. */
  readonly earned: number
  /** Half of that, the remainder dropped. */
  readonly half: number
  /** How many tasks were finished today and earned nothing. */
  readonly unpaid: number
  readonly span: CaseSpan
}

/** The Drop: yesterday's average task, and every task finished yesterday. */
export interface DailyWorking {
  readonly source: 'daily'
  /** What yesterday's tasks with points earned, bonuses and cases left out. */
  readonly paidPoints: number
  /** How many tasks yesterday earned points. The same task written twice is one. */
  readonly paidTasks: number
  /** Those points divided by those tasks, the remainder dropped, or 0 when there were none. */
  readonly average: number
  /** How many tasks were finished yesterday, with points or without. */
  readonly tasks: number
  readonly span: CaseSpan
}

/** Weekly: the cheapest task last week, that week's average task, and every task finished in it. */
export interface WeekWorking {
  readonly source: 'week'
  /** Points of the cheapest task finished last week, or null when that week has no task with points. */
  readonly cheapest: number | null
  /** What last week's tasks with points earned, bonuses and cases left out. */
  readonly paidPoints: number
  /** How many tasks last week earned points. The same task on two days counts twice. */
  readonly paidTasks: number
  /** Those points divided by those tasks, the remainder dropped, or 0 when there were none. */
  readonly average: number
  /** How many tasks were finished last week, with points or without. The same task on two days counts twice. */
  readonly tasks: number
  readonly span: CaseSpan
}

/**
 * What one case can pay, from the tasks and the ledger as they stand (CHST-10).
 *
 * **Payday** runs from the points of the cheapest task finished today, or 1
 * when no task today has points, up to half of everything earned today, the
 * remainder dropped, plus how many tasks finished today earned nothing.
 * Where that most falls short of the cheapest task — a day of one
 * task — the case pays exactly those points.
 *
 * The **Drop** runs from 0 up to yesterday's average task — what the tasks
 * with points earned divided by how many they were, the remainder dropped —
 * plus how many tasks were finished yesterday, with points or without. A
 * yesterday with no tasks pays 0.
 *
 * **Weekly** runs from the points of the cheapest task finished in the
 * previous week, or 1 when none had points, up to that week's average task
 * plus how many tasks were finished that week (CHST-30). Where that falls short
 * of the cheapest task, the case pays exactly those points.
 *
 * Everything earned on a day is the tasks and any bonus, and never a case
 * (CHST-8); an average task is the tasks alone. A task is one completion: the
 * same task written twice on a day is one, and one finished on two days of a
 * week is two. A task with points is one the ledger holds for that day; one
 * finished with none is in the tasks, not in the ledger, so it is never the
 * cheapest and never in an average, only counted — and not even that where
 * the account has said not to count them (`countUnpaid`, CHST-32).
 */
export function caseSpan(
  source: CaseSource,
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  now: Date = new Date(),
): CaseSpan {
  return caseWorking(source, tasks, entries, settings, now).span
}

/** The working behind `caseSpan`: the numbers the range is taken from (CHST-10). */
export function caseWorking(
  source: CaseSource,
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  now: Date = new Date(),
): CaseWorking {
  const { countUnpaid } = settings
  if (source === 'daily') return dailyWorking(tasks, entries, offsetDay(toLocalDay(now), -1), countUnpaid)
  if (source === 'week') return weekWorking(tasks, entries, daysOfPreviousWeek(now), countUnpaid)
  return todayWorking(tasks, entries, toLocalDay(now), countUnpaid)
}

/** The tasks finished on one day, as a case counts them. */
interface FinishedOn {
  /** Points of each task that earned some that day, one per task. */
  readonly paid: number[]
  /** How many tasks were finished that day and earned nothing. */
  readonly unpaid: number
}

/**
 * The tasks finished on a day. Those with points are the ledger's, so a task
 * gone to the trash or purged still counts what it earned. Those without are
 * the live tasks that stand done that day with nothing in the ledger for it:
 * a task with no points writes nothing there.
 */
function finishedOn(tasks: readonly Task[], entries: readonly RewardEntry[], day: LocalDay): FinishedOn {
  const seen = new Set<TaskId>()
  const paid: number[] = []

  for (const entry of entries) {
    if (entry.day !== day || isCaseEarning(entry.taskId) || isBonus(entry.taskId) || seen.has(entry.taskId)) continue
    seen.add(entry.taskId)
    paid.push(entry.points)
  }

  const unpaid = liveTasks(tasks).filter((task) => !seen.has(task.id) && completionDays(task).includes(day)).length
  return { paid, unpaid }
}

/** Everything earned on a day, leaving case openings out (CHST-8). */
function earnedOn(entries: readonly RewardEntry[], day: LocalDay): number {
  return entries.reduce((sum, entry) => (entry.day === day && !isCaseEarning(entry.taskId) ? sum + entry.points : sum), 0)
}

function todayWorking(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  day: LocalDay,
  countUnpaid: boolean,
): TodayWorking {
  const { paid, unpaid } = finishedOn(tasks, entries, day)
  const cheapest = cheapestOf(paid)
  const earned = earnedOn(entries, day)
  const half = Math.floor(earned / 2)
  const least = cheapest === null ? MIN_CASE_POINTS : Math.max(MIN_CASE_POINTS, cheapest)
  const most = half + (countUnpaid ? unpaid : 0)

  return { source: 'today', cheapest, earned, half, unpaid, span: { least, most: Math.max(least, most) } }
}

function dailyWorking(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  day: LocalDay,
  countUnpaid: boolean,
): DailyWorking {
  const { paid, unpaid } = finishedOn(tasks, entries, day)
  const paidPoints = sumOf(paid)
  const average = averageOf(paid)
  const finished = paid.length + unpaid
  const counted = paid.length + (countUnpaid ? unpaid : 0)

  return {
    source: 'daily',
    paidPoints,
    paidTasks: paid.length,
    average,
    tasks: finished,
    span: { least: DROP_LEAST, most: average + counted },
  }
}

function weekWorking(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  days: readonly LocalDay[],
  countUnpaid: boolean,
): WeekWorking {
  const paid: number[] = []
  let unpaid = 0
  for (const day of days) {
    const onDay = finishedOn(tasks, entries, day)
    paid.push(...onDay.paid)
    unpaid += onDay.unpaid
  }

  const cheapest = cheapestOf(paid)
  const average = averageOf(paid)
  const finished = paid.length + unpaid
  const counted = paid.length + (countUnpaid ? unpaid : 0)
  const least = cheapest === null ? MIN_CASE_POINTS : Math.max(MIN_CASE_POINTS, cheapest)

  return {
    source: 'week',
    cheapest,
    paidPoints: sumOf(paid),
    paidTasks: paid.length,
    average,
    tasks: finished,
    span: { least, most: Math.max(least, average + counted) },
  }
}

/** The cheapest task's points, or null when there is no task to take one from. */
function cheapestOf(tasks: readonly number[]): number | null {
  if (tasks.length === 0) return null
  return Math.floor(tasks.reduce((least, points) => Math.min(least, points), Number.POSITIVE_INFINITY))
}

function sumOf(points: readonly number[]): number {
  return points.reduce((sum, each) => sum + each, 0)
}

/** What a task with points earned on average, the remainder dropped, or 0 when there was none. */
function averageOf(points: readonly number[]): number {
  return points.length === 0 ? 0 : Math.floor(sumOf(points) / points.length)
}

/**
 * Everything earned today (CHST-7): what the tasks earned and any bonus paid
 * today — the same sum the Today tile of what was earned shows (RWD-20) —
 * leaving out Cases' own opening. Never less than 1, so a day that earned
 * nothing yet still has a number to halve from. What each case then pays is
 * `caseSpan`, not this whole sum.
 */
export function caseJackpot(entries: readonly RewardEntry[], now: Date = new Date()): number {
  return Math.max(MIN_CASE_POINTS, earnedOn(entries, toLocalDay(now)))
}

/**
 * Which quarter of the jackpot an opening came to, from 1 to 4: up to a quarter
 * of it is the first, more than three quarters the fourth. What colour its card
 * is (CHST-15); never what it pays, which is drawn without it.
 */
export type CaseQuarter = 1 | 2 | 3 | 4

/** The quarters, lowest first. */
export const CASE_QUARTERS: readonly CaseQuarter[] = [1, 2, 3, 4]

export function caseQuarter(points: number, jackpot: number): CaseQuarter {
  const share = points / Math.max(MIN_CASE_POINTS, jackpot)
  return Math.min(4, Math.max(1, Math.ceil(share * 4 - 1e-9))) as CaseQuarter
}

/** Today's opening, or null while today's case is still shut. */
export function caseOpened(entries: readonly RewardEntry[], now: Date = new Date()): RewardEntry | null {
  const today = toLocalDay(now)
  return entries.find((entry) => entry.taskId === CASE_TODAY_ID && entry.day === today) ?? null
}

/**
 * Why Cases has nothing to give just now, or null while a key is waiting.
 *
 * A day holds two keys (CHST-27): one for clearing Today, one at a random
 * moment. Opened is answered **first**, so a day that came clear, was opened
 * and then came undone again still reads as opened rather than as unclear:
 * Cases was opened, and that is the whole of it. What it gave is never
 * taken back either, unlike a period bonus (RWD-26) — there is no undoing a
 * thing whose point was the moment it happened.
 *
 * With one key gone, the bonus key's time decides: if it has not come yet,
 * Cases says so (`bonusWaiting`); if it has, Cases is open to be
 * pressed. With no key gone, the day being clear is the first thing asked,
 * and the bonus time the second — a day that is not clear but whose bonus
 * moment has passed still has a key to give.
 *
 * A clear day has everything it asked for done, so asking for at least so many
 * tasks is asking for at least so many done; and a day with nothing in it is
 * never clear (`isPeriodCleared`), so an empty day earns nothing.
 */
export function caseBlock(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  accountId: string,
  now: Date = new Date(),
): CaseBlock | null {
  const slots = caseSlots(tasks, entries, settings, accountId, now)
  // Weekly is on the page every day, and only a key on Monday. While it is
  // planned it does not decide whether a key is waiting today (CHST-30).
  const due = slots.filter((slot) => !(slot.source === 'week' && slot.state === 'waiting'))
  if (due.some((slot) => slot.state === 'ready')) return null
  // Opened cases stay on the page until the day ends. They are not still to open.
  const pending = due.filter((slot) => slot.state !== 'opened')
  if (pending.length === 0) return 'opened'

  // Nothing is ready. Today's case, when it is still planned, says what the day
  // is short of. Otherwise the only thing left is the daily case, on its clock.
  const todayWaiting = pending.some((slot) => slot.source === 'today')
  if (!todayWaiting) return 'bonusWaiting'

  const { total, remaining } = summarize(tasks, 'today', now)
  if (total === 0 || remaining > 0) return 'unclear'
  return 'tooSmall'
}

/** Whether a key is waiting, which is what the page and the notice ask. */
export function hasKey(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  accountId: string,
  now: Date = new Date(),
): boolean {
  return caseBlock(tasks, entries, settings, accountId, now) === null
}

/** All of today's openings, in the order they were written. */
export function caseOpenings(entries: readonly RewardEntry[], now: Date = new Date()): RewardEntry[] {
  const today = toLocalDay(now)
  return entries.filter((entry) => entry.taskId === CASE_TODAY_ID && entry.day === today)
}
