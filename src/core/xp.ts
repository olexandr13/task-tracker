/**
 * Levels: XP for nearly everything done in the app, and the level it adds up
 * to (LVL-1).
 *
 * Points (./reward) are a currency: earned and spent. XP is a record of effort:
 * it is never spent, so a prize bought never costs a level, but it is lost —
 * for a habit skipped or missed, a day with nothing finished, a task left
 * overdue — so a level can drop as well as rise, though XP never goes below
 * zero. Each action is worth a little, and more for more work: a task with a
 * time goal or a checklist is worth more to finish, and every point a task
 * earns is worth one XP besides.
 *
 * No history of it is kept: only where it stands (`XpProgress`) — the XP in
 * all, the day it began, the last day gone by that was counted, and how many
 * tasks today has added, for the day's limit. A change is worth what it is
 * worth as the tasks read before and after it (`XpDelta`), so taking one back
 * takes back what it is worth now. What the points gave is read off the points
 * ledger, which is kept anyway, rather than counted twice; and the level is
 * read off the total.
 */

import type { ActivityEntry } from './activity'
import type { Category } from './balance'
import { BONUS_PERIODS, isPeriodCleared } from './bonus'
import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { isOverdue } from './due'
import { habitLastDays, habitRestDays, isHabit } from './habit'
import type { HabitRests } from './habitRest'
import { JOURNAL_GOAL, JOURNAL_SECTIONS, journalLines, type JournalEntry } from './journal'
import { sameRepeat } from './repeat'
import { completionDays, type RewardEntry } from './reward'
import { isDeleted, startedOn, type Task } from './task'
import { historyEntries, keptEntries, type TimeEntry } from './timeLog'

/** What going from level 0 to 1 costs. */
export const XP_FIRST_STEP = 100
/** How much more each level costs than the one before. */
export const XP_GROWTH = 1.1

/** Adding a task. */
export const XP_ADD = 1
/** How many tasks added in a day count. */
export const XP_ADDS_A_DAY = 10
/** Finishing a task, before what its effort adds. */
export const XP_DONE = 2
/** Minutes of a time goal worth one XP more to finish. */
export const XP_GOAL_MINUTES = 15
/** The most a time goal adds. */
export const XP_GOAL_MAX = 8
/** The most a checklist adds, one an item. */
export const XP_CHECKLIST_MAX = 5
/** Clearing each period. */
export const XP_CLEAR = { today: 5, week: 25, month: 100 } as const
/** Minutes of logged time worth one XP. */
export const XP_TIME_MINUTES = 15
/** Writing anything in the journal on a day. */
export const XP_JOURNAL = 1
/** Every section of a day's journal at its goal, on top. */
export const XP_JOURNAL_FULL = 2
/** How many times what a habit's day is worth a miss costs. A skip costs it once. */
export const XP_MISS_FACTOR = 2
/** What a day with nothing finished costs. */
export const XP_IDLE = 10
/** What a task overdue at the end of a day costs. */
export const XP_OVERDUE = 1
/** The most being overdue costs in a day, however many tasks are. */
export const XP_OVERDUE_A_DAY = 10

/** Where XP stands: all that is kept of it. */
export interface XpProgress {
  /**
   * Everything gained and lost, but for what the points gave (`pointsXp`).
   * Below zero is allowed, down to what takes the points' XP back (`leastXp`).
   */
  readonly xp: number
  /** The day XP began (LVL-2): nothing before it counts. */
  readonly startedOn: LocalDay
  /** The last day gone by whose misses, idleness and overdue tasks were counted, or null for none yet. */
  readonly settledThrough: LocalDay | null
  /** The day `adds` counts the tasks of, or null before any was added. */
  readonly addsOn: LocalDay | null
  /** How many tasks were added that day, the first `XP_ADDS_A_DAY` of which count. */
  readonly adds: number
}

/** XP beginning on `day`, at nothing. */
export function startXp(day: LocalDay): XpProgress {
  return { xp: 0, startedOn: day, settledThrough: null, addsOn: null, adds: 0 }
}

/** Whether a value is a whole amount of XP. */
export function isXpAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

/**
 * What one change comes to. Tasks added today are counted apart: whether one
 * gives anything depends on how many came before it today, which only the
 * progress knows (`applyXp`).
 */
export interface XpDelta {
  /** XP gained, or lost below zero. */
  readonly xp: number
  /** Tasks added today, less those added today that were taken back. */
  readonly addedToday: number
}

export const NO_XP: XpDelta = { xp: 0, addedToday: 0 }

export function hasXp(delta: XpDelta): boolean {
  return delta.xp !== 0 || delta.addedToday !== 0
}

/** Several changes as one. */
export function joinXp(...deltas: readonly XpDelta[]): XpDelta {
  return deltas.reduce((sum, delta) => ({ xp: sum.xp + delta.xp, addedToday: sum.addedToday + delta.addedToday }), NO_XP)
}

/**
 * What a change does to where XP stands, on `today`: its XP, and for the tasks
 * added today, one each for those among the day's first `XP_ADDS_A_DAY` (LVL-4).
 * One taken back gives back what it gave, so taking back one of the first ten
 * lets the eleventh count.
 */
export function applyXp(progress: XpProgress, delta: XpDelta, today: LocalDay): XpProgress {
  const before = progress.addsOn === today ? progress.adds : 0
  const after = Math.max(0, before + delta.addedToday)
  const counted = Math.min(after, XP_ADDS_A_DAY) - Math.min(before, XP_ADDS_A_DAY)
  return {
    ...progress,
    xp: progress.xp + delta.xp + counted * XP_ADD,
    ...(delta.addedToday === 0 ? {} : { addsOn: today, adds: after }),
  }
}

// Tasks

/**
 * What finishing the task is worth, before its points: the same for everything,
 * plus a little for the effort it asks — a quarter of an hour of its time goal,
 * and an item of its checklist, are worth one more each, up to a limit.
 */
export function completionXp(task: Task): number {
  const goal = task.timeGoal === null ? 0 : Math.min(Math.floor(task.timeGoal / XP_GOAL_MINUTES), XP_GOAL_MAX)
  const checklist = Math.min(task.subtasks.length, XP_CHECKLIST_MAX)
  return XP_DONE + goal + checklist
}

/**
 * What a habit's day is worth: what finishing it gives, its points among it. A
 * skip costs this, and a miss twice this.
 */
export function habitDayXp(task: Task): number {
  return completionXp(task) + (task.reward ?? 0)
}

/** What a length of time logged is worth: one for every full quarter of an hour. */
export function timeXp(seconds: number): number {
  return Math.floor(seconds / (XP_TIME_MINUTES * 60))
}

/** Whether a task's adding counts: it is not in the trash, or it was finished before it went there. */
function addCounts(task: Task): boolean {
  return !isDeleted(task) || completionDays(task).length > 0
}

/** What the days gone by have been counted up to, so a change to one of them can be put right (LVL-12, LVL-13). */
export interface XpSettled {
  readonly startedOn: LocalDay
  readonly settledThrough: LocalDay | null
}

/** How many tasks stand done on each day. */
function doneCounts(tasks: readonly Task[]): Map<LocalDay, number> {
  const counts = new Map<LocalDay, number>()
  for (const task of tasks) for (const day of completionDays(task)) counts.set(day, (counts.get(day) ?? 0) + 1)
  return counts
}

/** Whether `day` has been counted already: since XP began, and no later than the last day counted. */
function isSettled(day: LocalDay, settled: XpSettled | null): boolean {
  return settled?.settledThrough != null && day >= settled.startedOn && day <= settled.settledThrough
}

/**
 * What a change to the tasks gave and took, task by task:
 *
 * - A task added counts toward the day it was written (LVL-4): today's among
 *   `addedToday`, an earlier day's — restored from the trash — at one XP.
 *   Deleted without ever having been finished, it takes that back.
 * - A day a task newly stands done on gives what finishing it is worth now
 *   (LVL-5); a day it no longer stands done on takes it back. Where that day
 *   was counted already (LVL-12, LVL-13), a habit's miss is given back or taken
 *   again, and so is the day's idleness when no other task was done on it.
 * - A day a habit newly rests on costs what its day is worth (LVL-12); one it
 *   no longer rests on gives that back.
 * - A session new, longer or shorter is worth its length now (LVL-7); one taken
 *   back — gone while still among those the task keeps — gives back what it is
 *   worth. One let go of with time was spent all the same.
 *
 * A change of rule gives and takes nothing beyond the adding, as for the points
 * (RWD-12). A task handed back as the very same object was not changed.
 */
export function taskXp(
  before: readonly Task[],
  after: readonly Task[],
  now: Date = new Date(),
  settled: XpSettled | null = null,
): XpDelta {
  const previous = new Map(before.map((task) => [task.id, task]))
  const today = toLocalDay(now)
  let xp = 0
  let addedToday = 0
  let doneBefore: Map<LocalDay, number> | null = null
  let doneAfter: Map<LocalDay, number> | null = null

  const added = (task: Task, count: number) => {
    if (toLocalDay(new Date(task.createdAt)) === today) addedToday += count
    else xp += count * XP_ADD
  }

  for (const task of after) {
    const was = previous.get(task.id)
    if (was === task) continue

    if (was === undefined) {
      if (!isDeleted(task)) added(task, 1)
      for (const entry of task.timeLog) xp += timeXp(entry.seconds)
      continue
    }

    const counted = addCounts(was)
    const counts = addCounts(task)
    if (counted && !counts) added(task, -1)
    if (!counted && counts) added(task, 1)

    if (!sameRepeat(was.repeat, task.repeat)) continue

    const doneThen = new Set(completionDays(was))
    const doneNow = new Set(completionDays(task))
    const restedThen = new Set(habitRestDays(was, now))
    const restsNow = new Set(habitRestDays(task, now))

    for (const day of doneNow) {
      if (doneThen.has(day)) continue
      xp += completionXp(task)
      if (!isSettled(day, settled)) continue
      if (isHabit(task) && day >= startedOn(task) && !restedThen.has(day)) xp += XP_MISS_FACTOR * habitDayXp(task)
      doneBefore ??= doneCounts(before)
      if ((doneBefore.get(day) ?? 0) === 0) xp += XP_IDLE
    }
    for (const day of doneThen) {
      if (doneNow.has(day)) continue
      xp -= completionXp(task)
      if (!isSettled(day, settled)) continue
      if (isHabit(task) && day >= startedOn(task) && !restsNow.has(day)) xp -= XP_MISS_FACTOR * habitDayXp(task)
      doneAfter ??= doneCounts(after)
      if ((doneAfter.get(day) ?? 0) === 0) xp -= XP_IDLE
    }

    for (const day of restsNow) if (!restedThen.has(day)) xp -= habitDayXp(task)
    for (const day of restedThen) if (!restsNow.has(day)) xp += habitDayXp(task)

    xp += sessionsXp(was.timeLog, task.timeLog, keptEntries(was.timeLog, was.repeat, now))
  }

  return { xp, addedToday }
}

/**
 * What a change to a set of sessions is worth (LVL-7): each new or resized one
 * at its length now, less what it was worth before; each gone that was still
 * among `kept` — taken back rather than let go of with time — less what it is
 * worth.
 */
function sessionsXp(before: readonly TimeEntry[], after: readonly TimeEntry[], kept: readonly TimeEntry[]): number {
  const had = new Map(before.map((entry) => [entry.id, entry.seconds]))
  const has = new Set(after.map((entry) => entry.id))
  let xp = 0
  for (const entry of after) {
    const seconds = had.get(entry.id)
    xp += timeXp(entry.seconds) - (seconds === undefined ? 0 : timeXp(seconds))
  }
  for (const entry of kept) if (!has.has(entry.id)) xp -= timeXp(entry.seconds)
  return xp
}

/**
 * What a change to the tasks did to Today, this week and this month (LVL-6):
 * clearing one gives its XP; leaving it unclear again takes that back. A period
 * clear before and after changes nothing, so it gives once however much more is
 * finished.
 */
export function clearXp(before: readonly Task[], after: readonly Task[], now: Date = new Date()): number {
  let xp = 0
  for (const period of BONUS_PERIODS) {
    const was = isPeriodCleared(before, period, now)
    const is = isPeriodCleared(after, period, now)
    if (was !== is) xp += is ? XP_CLEAR[period] : -XP_CLEAR[period]
  }
  return xp
}

// Time logged elsewhere, and the journal

/**
 * What a change to the Balance categories' own time is worth (LVL-7): sessions
 * logged or resized at their length, and sessions taken back — one gone while
 * the category still keeps it, or a category deleted with its time (BAL-10) —
 * less what they are worth. A category put back gives its time again.
 */
export function categoryXp(before: readonly Category[], after: readonly Category[], now: Date = new Date()): number {
  const previous = new Map(before.map((category) => [category.id, category]))
  const next = new Set(after.map((category) => category.id))
  let xp = 0
  for (const category of after) {
    const was = previous.get(category.id)
    if (was === category) continue
    xp += sessionsXp(was?.timeLog ?? [], category.timeLog, was === undefined ? [] : historyEntries(was.timeLog, now))
  }
  for (const category of before) {
    if (!next.has(category.id)) xp -= category.timeLog.reduce((sum, entry) => sum + timeXp(entry.seconds), 0)
  }
  return xp
}

/**
 * What a change to the activity log is worth (LVL-7). Only a record typed
 * counts: one made from a task's session (ACT-21) is that session's time,
 * counted already.
 */
export function activityXp(before: readonly ActivityEntry[], after: readonly ActivityEntry[]): number {
  const worth = (entries: readonly ActivityEntry[]) =>
    entries.reduce((sum, entry) => sum + (entry.session === null ? timeXp(entry.seconds) : 0), 0)
  return worth(after) - worth(before)
}

/** What a day of the journal is worth: one for anything written, and two more once every section has its five lines. */
function journalDayXp(entries: readonly JournalEntry[], day: LocalDay): number {
  const lines = JOURNAL_SECTIONS.map((section) => journalLines(entries, day, section).length)
  return (
    (lines.some((count) => count > 0) ? XP_JOURNAL : 0) +
    (lines.every((count) => count >= JOURNAL_GOAL) ? XP_JOURNAL_FULL : 0)
  )
}

/** What a change to the journal on `days` is worth (LVL-8): the days as they read after, less as they read before. */
export function journalXp(before: readonly JournalEntry[], after: readonly JournalEntry[], days: readonly LocalDay[]): number {
  return [...new Set(days)].reduce((sum, day) => sum + journalDayXp(after, day) - journalDayXp(before, day), 0)
}

// Days gone by

/** The last moment of a day. */
function endOfDay(day: LocalDay): Date {
  return new Date(startOfLocalDay(offsetDay(day, 1)).getTime() - 1)
}

/**
 * The task as it stood at `moment`, as near as what it keeps can say: a
 * completion after it not made yet. Its due date and rule are what they are
 * now, there being no record of what they were.
 */
function taskAsOf(task: Task, moment: Date): Task {
  const day = toLocalDay(moment)
  const doneDays = task.doneDays.filter((done) => done <= day)
  const skippedDays = task.skippedDays.filter((skipped) => skipped <= day)
  if (task.completedAt === null || new Date(task.completedAt) <= moment) return { ...task, doneDays, skippedDays }
  if (task.repeat === null) return { ...task, status: 'todo', completedAt: null }

  const last = doneDays.at(-1)
  return last === undefined
    ? { ...task, doneDays, skippedDays, status: 'todo', completedAt: null }
    : { ...task, doneDays, skippedDays, status: 'done', completedAt: startOfLocalDay(last).toISOString() }
}

/** Whether the task was there at `moment`: written by then, and not in the trash yet. */
function existedAt(task: Task, moment: Date): boolean {
  return new Date(task.createdAt) <= moment && (task.deletedAt === null || new Date(task.deletedAt) > moment)
}

/**
 * What the days gone by since the last one counted cost, up to yesterday, and
 * the day counted to — or null while there is no day to count: today is still
 * in play. Each day is counted once, as the tasks read now:
 *
 * - **Missed habit days** (LVL-12): a habit's day since it started, while it
 *   was there, that went by neither done nor rested costs twice what the day is
 *   worth (`habitDayXp`). A skip no rest was left to pay for (HAB-40) reads as
 *   missed, and costs what the skip did not.
 * - **A day with nothing finished** (LVL-13) costs `XP_IDLE`.
 * - **Overdue tasks** (LVL-14): every task overdue at the day's end, habits
 *   aside, costs `XP_OVERDUE`, and no more than `XP_OVERDUE_A_DAY` in all.
 *
 * A day marked done afterwards is put right as it changes (`taskXp`).
 */
export function settleXp(
  tasks: readonly Task[],
  progress: XpProgress,
  rests: HabitRests = null,
  now: Date = new Date(),
): { readonly xp: number; readonly settledThrough: LocalDay } | null {
  const today = toLocalDay(now)
  const yesterday = offsetDay(today, -1)
  const after = progress.settledThrough === null ? null : offsetDay(progress.settledThrough, 1)
  const first = after !== null && after > progress.startedOn ? after : progress.startedOn
  if (first > yesterday) return null

  let xp = 0
  const span = Math.round((startOfLocalDay(today).getTime() - startOfLocalDay(first).getTime()) / 86_400_000) + 1

  for (const task of tasks) {
    if (!isHabit(task)) continue
    const skipped = new Set(task.skippedDays)
    for (const { day, state } of habitLastDays(task, span, now, rests)) {
      if (day < first || day > yesterday || state !== 'missed' || !existedAt(task, endOfDay(day))) continue
      xp -= habitDayXp(task) * (skipped.has(day) ? XP_MISS_FACTOR - 1 : XP_MISS_FACTOR)
    }
  }

  const done = doneCounts(tasks)
  for (let day = first; day <= yesterday; day = offsetDay(day, 1)) {
    if ((done.get(day) ?? 0) === 0) xp -= XP_IDLE

    const end = endOfDay(day)
    let overdue = 0
    for (const task of tasks) {
      if (!isHabit(task) && existedAt(task, end) && isOverdue(taskAsOf(task, end), end)) overdue += XP_OVERDUE
    }
    xp -= Math.min(overdue, XP_OVERDUE_A_DAY)
  }

  return { xp, settledThrough: yesterday }
}

// The total

/** What the points earned since XP began give: one XP a point (LVL-9). */
export function pointsXp(entries: readonly RewardEntry[], startedOn: LocalDay): number {
  return entries.reduce((sum, entry) => sum + (entry.day >= startedOn ? entry.points : 0), 0)
}

/** XP in all: everything gained and lost, and what the points gave — never below zero (LVL-17). */
export function totalXp(progress: XpProgress, entries: readonly RewardEntry[]): number {
  return Math.max(0, progress.xp + pointsXp(entries, progress.startedOn))
}

/**
 * The least `XpProgress.xp` may be: what puts the total at zero (LVL-17). XP
 * lost below it is let go of, so what is gained after counts from zero.
 */
export function leastXp(progress: XpProgress, entries: readonly RewardEntry[]): number {
  return -pointsXp(entries, progress.startedOn)
}

// Levels

/** What going from `level` to the next costs: `XP_FIRST_STEP` from level 0, and `XP_GROWTH` times more each level after. */
export function levelStep(level: number): number {
  return Math.round(XP_FIRST_STEP * XP_GROWTH ** level)
}

/** The XP at which a level begins: what every step below it adds up to. */
export function levelFloor(level: number): number {
  let floor = 0
  for (let below = 0; below < level; below += 1) floor += levelStep(below)
  return floor
}

/** Where a total of XP stands. */
export interface LevelStanding {
  /** From 0, with no end. */
  readonly level: number
  readonly total: number
  /** How far into this level, from 0; 0 while the total is below zero. */
  readonly into: number
  /** What this level asks to reach the next. */
  readonly step: number
}

/**
 * The level a total reaches, stepped up to a level at a time so it always agrees
 * with the steps as `levelStep` rounds them. Everything starts at level 0, and
 * below zero is level 0 too, nothing into it.
 */
export function levelOf(total: number): LevelStanding {
  let level = 0
  let floor = 0
  while (total >= floor + levelStep(level)) {
    floor += levelStep(level)
    level += 1
  }
  return { level, total, into: Math.max(0, total - floor), step: levelStep(level) }
}
