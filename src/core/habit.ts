/**
 * Habits: tasks that come back every day, read as a record kept over time.
 *
 * A habit is not a record of its own kind. It is a repeating task whose rule
 * comes round every day, and everything it has to show — streaks, how often it
 * was kept, which days — is derived from the days it was done on
 * (`Task.doneDays`) and the day it is now. Like the rest of this layer, nothing
 * is stored for it and nothing rolls over at midnight.
 *
 * Two readings run through all of it:
 *
 * - **Today is still in play until it is over.** A habit not yet done today has
 *   not missed the day or broken its streak; it just has not been kept yet.
 * - **A day can only be missed once the habit has started.** From the day it
 *   starts — the day chosen for it, or the day it was written when none was
 *   (`startedOn`) — a day without a tick is a miss. Before that nothing was
 *   asked of it, so an unticked day is not tracked — and a day marked done back
 *   then is done without turning the days around it into misses. The same
 *   reading ./due gives a repeating task's occurrences from before its rule started.
 */

import { InvalidDayError, isLocalDay, offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { sortByOrder } from './order'
import { periodRange } from './progress'
import { repeatsEveryDay, type Repeat } from './repeat'
import { completeTask, isDeleted, startedOn, uncompleteTask, type Task } from './task'

/**
 * Whether a rule would make a habit of whatever carries it — asked of the rule
 * alone, before there is a task to ask it of (../app: what a warm-up holds back).
 */
export function isHabitRepeat(repeat: Repeat | null): boolean {
  return repeat !== null && repeatsEveryDay(repeat)
}

export function isHabit(task: Task): boolean {
  return isHabitRepeat(task.repeat)
}

/** The habits that are not in the trash, in the order of the list. */
export function habitTasks(tasks: readonly Task[]): Task[] {
  return sortByOrder(tasks.filter((task) => !isDeleted(task) && isHabit(task)))
}

/**
 * How one day of a habit reads:
 *
 * - `done` — it was done that day.
 * - `missed` — a day since the habit started that went by without it.
 * - `pending` — today, not done yet.
 * - `untracked` — a day before the habit started, and not done.
 * - `future` — not here yet.
 */
export type HabitDayState = 'done' | 'missed' | 'pending' | 'untracked' | 'future'

export interface HabitDay {
  readonly day: LocalDay
  readonly state: HabitDayState
}

export interface HabitStats {
  /** Days in a row it was done, up to today — or up to yesterday while today is still to do. */
  readonly currentStreak: number
  /** The longest run of days in a row it was ever done. */
  readonly bestStreak: number
}

export interface HabitRate {
  readonly done: number
  /**
   * The days that count: every day since the habit started and every day it was
   * done on before that, with today among them only once it is done. Zero when
   * there are none, and so no rate to give.
   */
  readonly days: number
  /** 0-100, rounded down so that 100 only ever means every day was kept. */
  readonly percent: number
}

export function habitStats(task: Task, now: Date = new Date()): HabitStats {
  const today = toLocalDay(now)
  const done = recordedDays(task, today)
  const set = new Set(done)

  return {
    currentStreak: runEndingAt(set, set.has(today) ? today : offsetDay(today, -1)),
    bestStreak: longestRun(done),
  }
}

/**
 * How the last `days` days went, today included — the last 7, the last 30, the
 * last year. The days that count are the ones that could be missed, since the
 * habit started, and the ones it was done on before that; today only once it
 * is done.
 */
export function habitRate(task: Task, days: number, now: Date = new Date()): HabitRate {
  const today = toLocalDay(now)
  const done = recordedDays(task, today)
  const windowStart = offsetDay(today, 1 - days)
  const windowEnd = done.at(-1) === today ? today : offsetDay(today, -1)
  const inWindow = (day: LocalDay) => day >= windowStart && day <= windowEnd

  const started = startedOn(task)
  const trackedFrom = started > windowStart ? started : windowStart
  const tracked = Math.max(0, daysBetween(trackedFrom, windowEnd) + 1)
  const kept = done.filter(inWindow).length
  const doneBefore = done.filter((day) => inWindow(day) && day < trackedFrom).length
  const counted = tracked + doneBefore

  return { done: kept, days: counted, percent: counted === 0 ? 0 : Math.floor((kept / counted) * 100) }
}

/**
 * Marks a habit done on a day, or not done — today, or any day before it, so a
 * day that was kept but not ticked can still be recorded, and one ticked by
 * mistake taken back.
 *
 * Today is the task's own box: it goes through `completeTask` and
 * `uncompleteTask`, checklist and all. An earlier day only changes the history,
 * and the completion time where that has to follow: it stays the most recent
 * day the habit was done, so the week and month bars count what the history
 * says. A backfilled day has no time of its own and is stamped at its start.
 *
 * A day still to come cannot be done yet, and a task that is not a habit keeps
 * no history of days to change: both leave the task as it is. Returns the task
 * itself whenever nothing changes; the one passed in is never modified.
 */
export function setDoneOnDay(task: Task, day: LocalDay, done: boolean, now: Date = new Date()): Task {
  if (!isLocalDay(day)) {
    throw new InvalidDayError(day)
  }

  const today = toLocalDay(now)
  if (!isHabit(task) || day > today) {
    return task
  }

  if (day === today) {
    return done ? completeTask(task, now) : uncompleteTask(task, now)
  }

  if (task.doneDays.includes(day) === done) {
    return task
  }

  const last = task.completedAt === null ? null : toLocalDay(new Date(task.completedAt))

  if (done) {
    const doneDays = [...task.doneDays, day].sort()
    return last !== null && last >= day
      ? { ...task, doneDays }
      : { ...task, doneDays, status: 'done', completedAt: startOfLocalDay(day).toISOString() }
  }

  const doneDays = task.doneDays.filter((recorded) => recorded !== day)
  if (last !== day) {
    return { ...task, doneDays }
  }

  const before = doneDays.filter((recorded) => recorded < day).at(-1)
  return before === undefined
    ? { ...task, doneDays, status: 'todo', completedAt: null }
    : { ...task, doneDays, status: 'done', completedAt: startOfLocalDay(before).toISOString() }
}

/**
 * The habit's days laid out as calendar weeks, Monday to Sunday — the week
 * ./progress counts in — oldest week first and ending with this one, days after
 * today and all. There are always `weeks` full weeks, so every row of a grid
 * drawn from them lines up.
 */
export function habitWeeks(task: Task, weeks: number, now: Date = new Date()): HabitDay[][] {
  const today = toLocalDay(now)
  const set = new Set(recordedDays(task, today))
  const started = startedOn(task)
  const thisMonday = toLocalDay(periodRange('week', now).start)

  return Array.from({ length: weeks }, (_, week) => {
    const monday = offsetDay(thisMonday, (week - weeks + 1) * 7)
    return Array.from({ length: 7 }, (_, offset) => {
      const day = offsetDay(monday, offset)
      return { day, state: stateOf(day, today, set, started) }
    })
  })
}

/**
 * The last `days` days, oldest first and ending with today, each read as in
 * `habitWeeks` — the run a folded card shows beside its streak.
 */
export function habitLastDays(task: Task, days: number, now: Date = new Date()): HabitDay[] {
  const today = toLocalDay(now)
  const set = new Set(recordedDays(task, today))
  const started = startedOn(task)

  return Array.from({ length: days }, (_, at) => {
    const day = offsetDay(today, at - days + 1)
    return { day, state: stateOf(day, today, set, started) }
  })
}

function stateOf(day: LocalDay, today: LocalDay, done: ReadonlySet<LocalDay>, started: LocalDay): HabitDayState {
  if (day > today) return 'future'
  if (done.has(day)) return 'done'
  if (day === today) return 'pending'
  return day >= started ? 'missed' : 'untracked'
}

/**
 * The days it was done on, oldest first, each once. Days after today are left
 * out: a clock running ahead on another device should not be able to put a
 * habit ahead of itself.
 */
function recordedDays(task: Task, today: LocalDay): LocalDay[] {
  return [...new Set(task.doneDays)].filter((day) => day <= today).sort()
}

function runEndingAt(done: ReadonlySet<LocalDay>, last: LocalDay): number {
  let run = 0
  for (let day = last; done.has(day); day = offsetDay(day, -1)) {
    run += 1
  }
  return run
}

function longestRun(done: readonly LocalDay[]): number {
  let best = 0
  let run = 0
  done.forEach((day, at) => {
    run = at > 0 && offsetDay(done[at - 1], 1) === day ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

/** Whole days from one day to another, however long a daylight saving day ran. */
function daysBetween(from: LocalDay, to: LocalDay): number {
  const ms = startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}
