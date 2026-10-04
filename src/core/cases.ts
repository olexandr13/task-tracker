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
 * Nothing here is stored but the one setting. Whether a key is waiting is
 * derived from the tasks as they stand and the ledger as it stands, the same
 * question the progress bars already answer (./progress).
 */

import { isBonus } from './bonus'
import { offsetDay, toLocalDay, type LocalDay } from './day'
import { periodRange, summarize } from './progress'
import type { RewardEntry } from './reward'
import type { Task, TaskId } from './task'
import { dailyCaseOpened, dailyKeyTime, todayCaseOpened, weekCaseOpened } from './caseKey'

/** What one opening gave. */
export interface CaseOpen {
  /** What it paid: a whole number of points, from the least to the most. */
  readonly points: number
  /** The most this case could pay, as it stood when it was opened. */
  readonly jackpot: number
  /**
   * The least this case could pay. Absent means 1, which is what a draw from
   * 1 up to the jackpot uses.
   */
  readonly least?: number
}

/** The whole-number range one case can pay. `least` is never above `most`. */
export interface CaseSpan {
  readonly least: number
  readonly most: number
}

/**
 * The least a case can pay (CHST-11) — and so also the least the jackpot itself
 * can be (CHST-9): a case that could give 1 point at best and 0 at worst would
 * be a case that could be empty.
 */
export const MIN_CASE_POINTS = 1

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

/** What a day has to be before it earns a key. */
export interface CaseSettings {
  /**
   * How many tasks the day has to have asked for. A day with fewer earns no key
   * however clear it is, so a single thing remembered at nine in the evening is
   * not a day's work.
   */
  readonly leastTasks: number
}

export const MIN_LEAST_TASKS = 1
export const MAX_LEAST_TASKS = 99

/** What an account starts with: any cleared day earns a key. */
export const DEFAULT_CASES: CaseSettings = { leastTasks: MIN_LEAST_TASKS }

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
  /** When a waiting daily case arrives. Today's case has no clock, and neither does one already opened. */
  readonly at: Date | null
}

/**
 * The cases in front of someone today (CHST-28, CHST-30). Today's is planned
 * while the day has work left on it, and ready once that work is done. The
 * daily case is planned until its moment, then ready. Weekly is planned until
 * Monday, then ready from the start of that day, and it carries no clock: the
 * timer is only for today's Drop (CHST-29). Each one stays, opened, until the
 * day ends. An empty day plans no Today case: there was nothing to clear.
 */
export function caseSlots(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  now: Date = new Date(),
): CaseSlot[] {
  const slots: CaseSlot[] = []
  const { total, remaining } = summarize(tasks, 'today', now)
  const dayCleared = total > 0 && remaining === 0 && total >= settings.leastTasks

  if (todayCaseOpened(entries, now)) slots.push({ source: 'today', state: 'opened', at: null })
  else if (dayCleared) slots.push({ source: 'today', state: 'ready', at: null })
  else if (total > 0 && remaining > 0) slots.push({ source: 'today', state: 'waiting', at: null })

  if (dailyCaseOpened(entries, now)) slots.push({ source: 'daily', state: 'opened', at: null })
  else {
    const at = dailyKeyTime(toLocalDay(now))
    if (now.getTime() >= at.getTime()) slots.push({ source: 'daily', state: 'ready', at: null })
    else slots.push({ source: 'daily', state: 'waiting', at })
  }

  if (!isMonday(now)) slots.push({ source: 'week', state: 'waiting', at: null })
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
 * is still which quarter of the case the points came to.
 */
export function openSpan(span: CaseSpan, random: () => number = Math.random): CaseOpen {
  const least = Math.max(MIN_CASE_POINTS, Math.floor(span.least))
  const most = Math.max(least, Math.floor(span.most))
  const points = least + Math.floor(random() * (most - least + 1))

  return { points, jackpot: most, least }
}

/**
 * The numbers one case's range is worked out from (CHST-10). `span` is what
 * the case then pays. The rest is the working, so it can be shown.
 */
export type CaseWorking = TodayWorking | DailyWorking | WeekWorking

/** Payday: the cheapest task today, and half of everything earned today. */
export interface TodayWorking {
  readonly source: 'today'
  /** Points of the cheapest task finished today, or null when today has no task. */
  readonly cheapest: number | null
  /** Everything earned today, cases left out. */
  readonly earned: number
  /** Half of that, the remainder dropped, before it is raised to the cheapest task. */
  readonly half: number
  readonly span: CaseSpan
}

/** The Drop: everything earned yesterday, divided by how many tasks that was. */
export interface DailyWorking {
  readonly source: 'daily'
  /** Everything earned yesterday, cases left out. */
  readonly earned: number
  /** How many tasks yesterday counts. The same task written twice is one. */
  readonly tasks: number
  /** Yesterday divided by those tasks, the remainder dropped, or 0 when there were none. */
  readonly share: number
  readonly span: CaseSpan
}

/** Weekly: the cheapest task last week, and that week divided by its tasks. */
export interface WeekWorking {
  readonly source: 'week'
  /** Points of the cheapest task finished last week, or null when that week has no task. */
  readonly cheapest: number | null
  /** Everything earned last week, cases left out. */
  readonly earned: number
  /** How many tasks last week counts. The same task on two days counts twice. */
  readonly tasks: number
  /** Last week divided by those tasks, the remainder dropped, or 0 when there were none. */
  readonly share: number
  readonly span: CaseSpan
}

/**
 * What one case can pay, from the ledger as it stands (CHST-10).
 *
 * **Payday** runs from the points of the cheapest task finished today up to
 * half of everything earned today, the remainder dropped. Half that falls
 * short of that cheapest task — a day of one task — pays exactly those
 * points, so the case never pays less than the cheapest task.
 *
 * The **Drop** runs from 1 up to everything earned yesterday divided by how many
 * tasks that was, the remainder dropped, and never under 1. Yesterday with no
 * tasks pays 1.
 *
 * **Weekly** runs from the points of the cheapest task finished in the
 * previous week up to everything earned that week divided by how many tasks
 * that was, the remainder dropped (CHST-30). A task finished on two days of
 * that week counts twice. The same task written twice on one day is one. A
 * previous week with no tasks pays 1. Where that average falls short of the
 * cheapest task, the case pays exactly those points.
 *
 * Everything earned on a day is the tasks and any bonus, and never a case
 * (CHST-8). A task is one completion: the same task written twice is one.
 */
export function caseSpan(source: CaseSource, entries: readonly RewardEntry[], now: Date = new Date()): CaseSpan {
  return caseWorking(source, entries, now).span
}

/** The working behind `caseSpan`: the numbers the range is taken from (CHST-10). */
export function caseWorking(source: CaseSource, entries: readonly RewardEntry[], now: Date = new Date()): CaseWorking {
  if (source === 'daily') return dailyWorking(entries, offsetDay(toLocalDay(now), -1))
  if (source === 'week') return weekWorking(entries, daysOfPreviousWeek(now))
  return todayWorking(entries, toLocalDay(now))
}

/** Points of the tasks finished on a day, one per task. */
function taskPoints(entries: readonly RewardEntry[], day: LocalDay): number[] {
  const seen = new Set<TaskId>()
  const points: number[] = []

  for (const entry of entries) {
    if (entry.day !== day || isCaseEarning(entry.taskId) || isBonus(entry.taskId) || seen.has(entry.taskId)) continue
    seen.add(entry.taskId)
    points.push(entry.points)
  }

  return points
}

/** Everything earned on a day, leaving case openings out (CHST-8). */
function earnedOn(entries: readonly RewardEntry[], day: LocalDay): number {
  return entries.reduce((sum, entry) => (entry.day === day && !isCaseEarning(entry.taskId) ? sum + entry.points : sum), 0)
}

function todayWorking(entries: readonly RewardEntry[], day: LocalDay): TodayWorking {
  const cheapest = cheapestOf(taskPoints(entries, day))
  const earned = earnedOn(entries, day)
  const half = Math.floor(earned / 2)
  const least = cheapest === null ? MIN_CASE_POINTS : Math.max(MIN_CASE_POINTS, cheapest)

  return { source: 'today', cheapest, earned, half, span: { least, most: Math.max(least, half) } }
}

function dailyWorking(entries: readonly RewardEntry[], day: LocalDay): DailyWorking {
  const tasks = taskPoints(entries, day)
  const earned = earnedOn(entries, day)
  const share = tasks.length === 0 ? 0 : Math.floor(earned / tasks.length)

  return {
    source: 'daily',
    earned,
    tasks: tasks.length,
    share,
    span: { least: MIN_CASE_POINTS, most: Math.max(MIN_CASE_POINTS, share) },
  }
}

function weekWorking(entries: readonly RewardEntry[], days: readonly LocalDay[]): WeekWorking {
  const tasks: number[] = []
  let earned = 0
  for (const day of days) {
    tasks.push(...taskPoints(entries, day))
    earned += earnedOn(entries, day)
  }

  const cheapest = cheapestOf(tasks)
  const share = tasks.length === 0 ? 0 : Math.floor(earned / tasks.length)
  const least = cheapest === null ? MIN_CASE_POINTS : Math.max(MIN_CASE_POINTS, cheapest)

  return {
    source: 'week',
    cheapest,
    earned,
    tasks: tasks.length,
    share,
    span: { least, most: Math.max(least, share) },
  }
}

/** The cheapest task's points, or null when there is no task to take one from. */
function cheapestOf(tasks: readonly number[]): number | null {
  if (tasks.length === 0) return null
  return Math.floor(tasks.reduce((least, points) => Math.min(least, points), Number.POSITIVE_INFINITY))
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
  now: Date = new Date(),
): CaseBlock | null {
  const slots = caseSlots(tasks, entries, settings, now)
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
  now: Date = new Date(),
): boolean {
  return caseBlock(tasks, entries, settings, now) === null
}

/** All of today's openings, in the order they were written. */
export function caseOpenings(entries: readonly RewardEntry[], now: Date = new Date()): RewardEntry[] {
  const today = toLocalDay(now)
  return entries.filter((entry) => entry.taskId === CASE_TODAY_ID && entry.day === today)
}
