/**
 * Time spent: how long a task asks for, and the sessions logged against it.
 *
 * Some tasks are an amount of time rather than a thing done — an hour of sport —
 * and that hour is often gathered in pieces through the day. A task can carry a
 * goal, in minutes, and each piece is logged as a session. Once the sessions
 * reach the goal the task is ready to be ticked off, and the row says so; the
 * tick is still the owner's to give, so time never finishes a task by itself.
 *
 * A session keeps its length to the second, so short timer runs add up: three
 * runs of 20 seconds make a minute. Time spent is read in whole minutes. A
 * session can carry a comment — what the time went on — given as it is logged.
 *
 * Under a repeating task a session counts for the occurrence it was logged in,
 * the same trick a checklist tick uses (./subtask): a daily hour starts from
 * nothing again tomorrow, and a weekly one when its next day comes round,
 * without anything running at midnight. Sessions from occurrences gone by no
 * longer count toward the goal, but they are still time spent: the Balance page
 * (./balance) reads them back by the day they were logged. So they are kept for
 * a while (`TIME_HISTORY_DAYS`) and let go of once older, the next time the task
 * logs, rather than piling up for ever.
 */

import { offsetDay, startOfLocalDay, toLocalDay } from './day'
import { countsForCurrentOccurrence, type Repeat } from './repeat'
import type { Task } from './task'

export type TimeEntryId = string

/** One session: some time, logged at a moment. */
export interface TimeEntry {
  readonly id: TimeEntryId
  /** Whole seconds, from 1 to `MAX_SESSION_SECONDS`. Logged by hand, always whole minutes. */
  readonly seconds: number
  /** ISO 8601 timestamp. Which occurrence the session counts for follows from it. */
  readonly loggedAt: string
  /** What the time went on, in the owner's words (`isTimeComment`), or null for nothing said. */
  readonly comment: string | null
}

/** The longest goal a task can ask for: a hundred hours. */
export const MAX_TIME_GOAL_MINUTES = 100 * 60

/** The longest one session can be: a whole day. */
export const MAX_SESSION_MINUTES = 24 * 60

/** The same day, to the second, for a session a timer logs. */
export const MAX_SESSION_SECONDS = MAX_SESSION_MINUTES * 60

export class InvalidTimeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTimeError'
  }
}

/** Whether a task can ask for this many minutes. */
export function isTimeGoal(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_TIME_GOAL_MINUTES
}

/** Whether one session logged by hand can be this many minutes long. */
export function isSessionLength(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_SESSION_MINUTES
}

/** Whether one session can be this many seconds long. */
export function isSessionSeconds(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds >= 1 && seconds <= MAX_SESSION_SECONDS
}

/** The longest comment a session can carry. */
export const MAX_TIME_COMMENT_LENGTH = 200

/** Whether a session can carry this comment: some words, on one line, of at most `MAX_TIME_COMMENT_LENGTH` characters. */
export function isTimeComment(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_TIME_COMMENT_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** A comment as kept: trimmed, and none for nothing but spaces. */
function toTimeComment(text: string | null): string | null {
  if (text === null || text.trim() === '') return null
  if (!isTimeComment(text)) {
    throw new InvalidTimeError(
      `"${text}" is not a comment: a comment is one line of at most ${String(MAX_TIME_COMMENT_LENGTH)} characters.`,
    )
  }
  return text.trim()
}

/**
 * Gives the task a goal, changes it, or takes it away with null. The sessions
 * logged stay as they are: the goal is what they are measured against, not
 * what they are.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function setTimeGoal(task: Task, minutes: number | null): Task {
  if (minutes !== null && !isTimeGoal(minutes)) {
    throw new InvalidTimeError(
      `${String(minutes)} is not a goal: a goal is a whole number of minutes from 1 to ${String(MAX_TIME_GOAL_MINUTES)}.`,
    )
  }

  return minutes === task.timeGoal ? task : { ...task, timeGoal: minutes }
}

export function hasTimeGoal(task: Task): boolean {
  return task.timeGoal !== null
}

/**
 * The sessions that count as of `now`, oldest first: every one under a task
 * that happens once, and those logged within the occurrence in play under a
 * repeating one.
 */
export function currentEntries(entries: readonly TimeEntry[], repeat: Repeat | null, now: Date): TimeEntry[] {
  return repeat === null
    ? [...entries]
    : entries.filter((entry) => countsForCurrentOccurrence(entry.loggedAt, repeat, now))
}

/**
 * How many days of sessions a task keeps, today among them, once they no longer
 * count for its occurrence: the history the Balance page reads (BAL-3).
 */
export const TIME_HISTORY_DAYS = 30

/**
 * The earliest moment a session gone by is still kept from: the start of the
 * day `TIME_HISTORY_DAYS` back, or of the month, whichever is earlier — so the
 * Balance page's month (BAL-2) is always whole.
 */
export function timeHistoryStart(now: Date): Date {
  const days = startOfLocalDay(offsetDay(toLocalDay(now), -(TIME_HISTORY_DAYS - 1)))
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  return days < month ? days : month
}

/**
 * The sessions a task keeps as of `now`, oldest first: every one that counts
 * (`currentEntries`), and those of occurrences gone by that are recent enough to
 * be history (`timeHistoryStart`). Only these are written back when the task
 * next logs; what counts toward the goal is still `currentEntries`.
 */
export function keptEntries(entries: readonly TimeEntry[], repeat: Repeat | null, now: Date): TimeEntry[] {
  if (repeat === null) return [...entries]

  const since = timeHistoryStart(now)
  return entries.filter(
    (entry) => new Date(entry.loggedAt) >= since || countsForCurrentOccurrence(entry.loggedAt, repeat, now),
  )
}

/**
 * The sessions recent enough to be history as of `now` (`timeHistoryStart`),
 * oldest first: all that is kept where nothing but the Balance page reads them,
 * as for time logged straight to a category (./balance).
 */
export function historyEntries(entries: readonly TimeEntry[], now: Date): TimeEntry[] {
  const since = timeHistoryStart(now)
  return entries.filter((entry) => new Date(entry.loggedAt) >= since)
}

/** A session of whole minutes, as typed or clicked, logged at `now` with what it went on when that is said. */
export function minutesEntry(minutes: number, now: Date = new Date(), comment: string | null = null): TimeEntry {
  if (!isSessionLength(minutes)) {
    throw new InvalidTimeError(
      `${String(minutes)} is not a session: a session is a whole number of minutes from 1 to ${String(MAX_SESSION_MINUTES)}.`,
    )
  }

  return secondsEntry(minutes * 60, now, comment)
}

/** A session to the second, as a timer ran it, logged at `now` with what it went on when that is said. */
export function secondsEntry(seconds: number, now: Date = new Date(), comment: string | null = null): TimeEntry {
  if (!isSessionSeconds(seconds)) {
    throw new InvalidTimeError(
      `${String(seconds)} is not a session: a session is a whole number of seconds from 1 to ${String(MAX_SESSION_SECONDS)}.`,
    )
  }

  return { id: crypto.randomUUID(), seconds, loggedAt: now.toISOString(), comment: toTimeComment(comment) }
}

/** The task with the session added, and the sessions it no longer keeps let go of. */
function withEntry(task: Task, entry: TimeEntry, now: Date): Task {
  return { ...task, timeLog: [...keptEntries(task.timeLog, task.repeat, now), entry] }
}

/**
 * Logs a session of whole minutes, as typed or clicked, with what it went on
 * when that is said. Whether the task is done is left alone either way: time
 * reaching the goal says the task is ready, not that it was done.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function logTime(task: Task, minutes: number, now: Date = new Date(), comment: string | null = null): Task {
  return withEntry(task, minutesEntry(minutes, now, comment), now)
}

/**
 * Logs a session to the second, as a timer ran it, with what it went on when
 * that is said. Seconds add up across sessions, so runs too short to make a
 * minute alone still count together.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function logSeconds(task: Task, seconds: number, now: Date = new Date(), comment: string | null = null): Task {
  return withEntry(task, secondsEntry(seconds, now, comment), now)
}

/**
 * Takes a session back — one logged by mistake, or for the wrong length. Like
 * logging, it leaves whether the task is done alone.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function removeTimeEntry(task: Task, entryId: TimeEntryId): Task {
  const kept = task.timeLog.filter((entry) => entry.id !== entryId)
  return kept.length === task.timeLog.length ? task : { ...task, timeLog: kept }
}

/** A session as it was logged, with the task it was logged on. */
export interface LoggedSession {
  readonly task: Task
  readonly entry: TimeEntry
}

/**
 * The sessions one change to the tasks logged: every session a task has after
 * it that it did not have before — logged from the clock, by the timer, or with
 * the task as it was added. A session gone is not one logged, and a task the
 * change did not touch is the very same object, so it is passed over unread.
 */
export function sessionsLogged(before: readonly Task[], after: readonly Task[]): LoggedSession[] {
  const previous = new Map(before.map((task) => [task.id, task]))
  return after.flatMap((task) => {
    const was = previous.get(task.id)
    if (was === task) return []
    const had = new Set(was?.timeLog.map((entry) => entry.id))
    return task.timeLog.filter((entry) => !had.has(entry.id)).map((entry) => ({ task, entry }))
  })
}

/** The seconds the sessions add up to. */
export function sessionSeconds(entries: readonly TimeEntry[]): number {
  return entries.reduce((total, entry) => total + entry.seconds, 0)
}

/** Whole minutes in `seconds`: what is shown, and what a goal is measured in. */
export function wholeMinutes(seconds: number): number {
  return Math.floor(seconds / 60)
}

/** The seconds that count as of `now`. */
export function secondsSpent(task: Task, now: Date = new Date()): number {
  return sessionSeconds(currentEntries(task.timeLog, task.repeat, now))
}

/** The whole minutes that count as of `now`, the seconds of every session added up first. */
export function timeSpent(task: Task, now: Date = new Date()): number {
  return wholeMinutes(secondsSpent(task, now))
}

/** Whether the task has a goal and the time that counts as of `now` has reached it. */
export function isTimeGoalReached(task: Task, now: Date = new Date()): boolean {
  return task.timeGoal !== null && timeSpent(task, now) >= task.timeGoal
}
