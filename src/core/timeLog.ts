/**
 * Time spent: how long a task asks for, and the sessions logged against it.
 *
 * Some tasks are an amount of time rather than a thing done — an hour of sport —
 * and that hour is often gathered in pieces through the day. A task can carry a
 * goal, in minutes, and each piece is logged as a session. Once the sessions
 * reach the goal the task is ready to be ticked off, and the row says so; the
 * tick is still the owner's to give, so time never finishes a task by itself.
 *
 * Under a repeating task a session counts for the occurrence it was logged in,
 * the same trick a checklist tick uses (./subtask): a daily hour starts from
 * nothing again tomorrow, and a weekly one when its next day comes round,
 * without anything running at midnight. Sessions from occurrences gone by are
 * dead weight, so logging lets go of them rather than piling them up.
 */

import { countsForCurrentOccurrence, type Repeat } from './repeat'
import type { Task } from './task'

export type TimeEntryId = string

/** One session: some minutes, logged at a moment. */
export interface TimeEntry {
  readonly id: TimeEntryId
  /** Whole minutes, from 1 to `MAX_SESSION_MINUTES`. */
  readonly minutes: number
  /** ISO 8601 timestamp. Which occurrence the session counts for follows from it. */
  readonly loggedAt: string
}

/** The longest goal a task can ask for: a hundred hours. */
export const MAX_TIME_GOAL_MINUTES = 100 * 60

/** The longest one session can be: a whole day. */
export const MAX_SESSION_MINUTES = 24 * 60

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

/** Whether one session can be this many minutes long. */
export function isSessionLength(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_SESSION_MINUTES
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
 * Logs a session. Whether the task is done is left alone either way: time
 * reaching the goal says the task is ready, not that it was done.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function logTime(task: Task, minutes: number, now: Date = new Date()): Task {
  if (!isSessionLength(minutes)) {
    throw new InvalidTimeError(
      `${String(minutes)} is not a session: a session is a whole number of minutes from 1 to ${String(MAX_SESSION_MINUTES)}.`,
    )
  }

  const entry: TimeEntry = { id: crypto.randomUUID(), minutes, loggedAt: now.toISOString() }
  return { ...task, timeLog: [...currentEntries(task.timeLog, task.repeat, now), entry] }
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

/** The minutes that count as of `now`. */
export function timeSpent(task: Task, now: Date = new Date()): number {
  return currentEntries(task.timeLog, task.repeat, now).reduce((total, entry) => total + entry.minutes, 0)
}

/** Whether the task has a goal and the time that counts as of `now` has reached it. */
export function isTimeGoalReached(task: Task, now: Date = new Date()): boolean {
  return task.timeGoal !== null && timeSpent(task, now) >= task.timeGoal
}
