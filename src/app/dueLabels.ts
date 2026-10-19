import {
  isComplete,
  offsetDay,
  startOfLocalDay,
  timesPutOff,
  toLocalDay,
  type LocalDay,
  type LocalTime,
  type Task,
} from '../core'

/**
 * How a due date reads on screen. The days themselves live in ../core; wording
 * is presentation, so it stays here.
 */

/** What heads the run of tasks whose day has gone by. */
export const OVERDUE_LABEL = 'Overdue'

/** Relative where that is quicker to read — Today, Tomorrow, Yesterday — and a short date otherwise. */
export function describeDueDate(day: LocalDay, now: Date): string {
  const today = toLocalDay(now)
  if (day === today) return 'Today'
  if (day === offsetDay(today, 1)) return 'Tomorrow'
  if (day === offsetDay(today, -1)) return 'Yesterday'
  return describeShortDate(day, now)
}

/** A month and its year, as a calendar is headed: "September 2026". */
export function describeMonth(month: LocalDay): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(startOfLocalDay(month))
}

/** A day in full, as a screen reader hears a calendar's day: "Thursday, October 1, 2026". */
export function describeFullDate(day: LocalDay): string {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(
    startOfLocalDay(day),
  )
}

/** A short date — "Sep 20" — with the year only when it is not this one: "Sep 20" is plainly this September. */
export function describeShortDate(day: LocalDay, now: Date): string {
  const date = startOfLocalDay(day)
  return date.getFullYear() === now.getFullYear()
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

/**
 * An hour as the clock reads it here — "09:00", "18:30" — with no day around it.
 * The app keeps a twenty-four hour clock throughout, the face it is picked off
 * included (DUE-24), so an hour says which hour of the day it is on its own.
 */
export function describeTimeOfDay(time: LocalTime): string {
  return time
}

/**
 * A day with the hour it is due at, where it is due at one: "Today at 09:00".
 * Without an hour it is the day alone, which is what most tasks have.
 */
export function describeDueAt(day: LocalDay, time: LocalTime | null, now: Date): string {
  const date = describeDueDate(day, now)
  return time === null ? date : `${date} at ${describeTimeOfDay(time)}`
}

/**
 * How many times a task is put off before its row says so (DUE-29). Once is an
 * ordinary change of plan; twice is the start of a habit worth seeing.
 */
export const PUT_OFF_SHOWN_FROM = 2

/** What a task put off says about it: the mark on its row, and the same in words. */
export interface PutOffMark {
  /** "Put off 3×", beside the title. */
  readonly label: string
  /** The sentences the mark stands for: its tooltip, a phone's sheet, and what a screen reader hears. */
  readonly detail: string
}

/**
 * What a task put off says about it (DUE-29), or null where it says nothing: a
 * one-off still to do, put off at least `PUT_OFF_SHOWN_FROM` times. Done, it has
 * been dealt with; repeating, its days are its rule's, and a one-off's put-offs
 * carried into a rule would be about a different task.
 */
export function describePutOff(task: Task, now: Date): PutOffMark | null {
  const times = timesPutOff(task)
  const first = task.putOffDays[0]
  if (task.repeat !== null || isComplete(task, now) || times < PUT_OFF_SHOWN_FROM || first === undefined) return null

  return {
    label: `Put off ${String(times)}×`,
    detail: `You moved this task to a later day ${String(times)} times when it was due. The first time was ${describeShortDate(first, now)}.`,
  }
}
