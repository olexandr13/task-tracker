/**
 * The check-in: at the top of every hour, between the hours the owner keeps to,
 * the app asks what was done in the hour that just ended — unless it is logged
 * already (CHECKIN-1). The same hours say which of a day's hours were meant to
 * be logged, so how much of a day is logged, and how many days in a row were
 * logged in full, are read against them too (ACT-17, ACT-18).
 *
 * Pure derivation over the records and a moment in time. Nothing here counts
 * down: which hour just ended, and whether it is logged, are asked of the clock
 * and the records each time — on the device, and by the sender that pushes the
 * check-in when the app is closed, which reads the clock in the device's own
 * time zone (`wallClock`).
 */

import {
  hasSlotEnded,
  hasSlotStarted,
  isSlotLogged,
  loggedSlots,
  slotAt,
  slotBefore,
  slotKey,
  type ActivityEntry,
  type HourSlot,
} from './activity'
import { isLocalDay, toLocalDay, type LocalDay, type LocalTime } from './day'
import { isHoursWindow, isTimeWithinHours, type HoursWindow } from './hours'

/** A working day's hours, asked about from 10:00, the end of the first, to 22:00. */
export const DEFAULT_CHECK_IN_WINDOW: HoursWindow = { from: '09:00', to: '22:00' }

/** Whether a time of day is on the hour: a check-in's hours begin and end on one. */
export function isWholeHour(time: LocalTime): boolean {
  return time.endsWith(':00')
}

/** Hours a check-in can keep to: a window whose ends are both on the hour. */
export function isCheckInWindow(value: unknown): value is HoursWindow {
  return isHoursWindow(value) && isWholeHour(value.from) && isWholeHour(value.to)
}

function onTheHour(hour: number): LocalTime {
  return `${String(hour).padStart(2, '0')}:00`
}

/**
 * The hours of a day that are meant to be logged: those whose start lies inside
 * the window, in clock order. 09:00–22:00 is 9 to 21, thirteen hours; a window
 * past midnight, 22:00–02:00, is 0, 1, 22 and 23 of any one day; and a window
 * whose ends are the same hour is all twenty-four.
 */
export function expectedHours(window: HoursWindow): number[] {
  return Array.from({ length: 24 }, (_, hour) => hour).filter((hour) => isTimeWithinHours(window, onTheHour(hour)))
}

/** Whether the slot is one the check-in asks about. */
export function isExpectedSlot(window: HoursWindow, slot: HourSlot): boolean {
  return isTimeWithinHours(window, onTheHour(slot.hour))
}

/** The hour that ended last: from 15:00 to 15:59, the 14:00 one. */
export function slotJustEnded(now: Date): HourSlot {
  return slotBefore(slotAt(now))
}

/** How far a day's meant-to-be-logged hours are logged (ACT-17). */
export interface LoggedHours {
  /** Hours of the day meant to be logged. */
  readonly expected: number
  /** Of those, the ones over by now. */
  readonly ended: number
  /** Of the ones over, the ones something is logged under. */
  readonly logged: number
}

export function loggedHours(
  entries: readonly ActivityEntry[],
  window: HoursWindow,
  day: LocalDay,
  now: Date = new Date(),
): LoggedHours {
  const slots = expectedHours(window).map((hour) => ({ day, hour }))
  const ended = slots.filter((slot) => hasSlotEnded(slot, now))
  return {
    expected: slots.length,
    ended: ended.length,
    logged: ended.filter((slot) => isSlotLogged(entries, slot)).length,
  }
}

function isLoggedInFull(logged: ReadonlySet<string>, window: HoursWindow, day: LocalDay, now: Date): boolean {
  const slots = expectedHours(window).map((hour) => ({ day, hour }))
  return slots.length > 0 && slots.every((slot) => hasSlotEnded(slot, now) && logged.has(slotKey(slot)))
}

/** Whether every hour of the day meant to be logged is over and logged (ACT-18). */
export function isDayLoggedInFull(
  entries: readonly ActivityEntry[],
  window: HoursWindow,
  day: LocalDay,
  now: Date = new Date(),
): boolean {
  return isLoggedInFull(loggedSlots(entries), window, day, now)
}

/** How many of the days given, up to today, were logged in full (ACT-18). */
export interface DaysInFull {
  /** Days logged in full. */
  readonly inFull: number
  /** The days given that have begun: today and the days before it. */
  readonly counted: number
}

export function daysLoggedInFull(
  entries: readonly ActivityEntry[],
  window: HoursWindow,
  days: readonly LocalDay[],
  now: Date = new Date(),
): DaysInFull {
  const logged = loggedSlots(entries)
  const today = toLocalDay(now)
  const counted = days.filter((day) => day <= today)
  return { inFull: counted.filter((day) => isLoggedInFull(logged, window, day, now)).length, counted: counted.length }
}

/**
 * The hours of a day the log lists (ACT-7): those meant to be logged that have
 * begun by `now` — every one of them on a day gone by — and any other hour with
 * something logged under it, in clock order.
 */
export function hoursOfDay(entries: readonly ActivityEntry[], window: HoursWindow, day: LocalDay, now: Date = new Date()): number[] {
  const hours = new Set(expectedHours(window).filter((hour) => hasSlotStarted({ day, hour }, now)))
  for (const entry of entries) {
    if (entry.day === day) hours.add(entry.hour)
  }
  return [...hours].sort((a, b) => a - b)
}

/**
 * The hour a record is logged under unless another is picked (ACT-5). Today,
 * the hour that just ended while nothing is logged under it — what a check-in
 * asks about — and otherwise the hour under way. A day gone by, its first hour
 * meant to be logged that is not, or its first hour meant to be logged.
 */
export function defaultLogSlot(
  entries: readonly ActivityEntry[],
  window: HoursWindow,
  day: LocalDay,
  now: Date = new Date(),
): HourSlot {
  if (day >= toLocalDay(now)) {
    const ended = slotJustEnded(now)
    return ended.day === toLocalDay(now) && !isSlotLogged(entries, ended) ? ended : slotAt(now)
  }

  const expected = expectedHours(window)
  const open = expected.find((hour) => !isSlotLogged(entries, { day, hour }))
  return { day, hour: open ?? expected[0] ?? 0 }
}

/** A check-in standing: the hour asked about, and how many more of its day are still not logged. */
export interface PendingCheckIn {
  readonly slot: HourSlot
  readonly others: number
}

/**
 * What the check-in asks about at `now`, or null (CHECKIN-3): the hour that
 * just ended, while it is one of the hours kept to, nothing is logged under it,
 * and it was not dismissed on this device. It stands for the hour after it,
 * until the next one ends. The others are the day's other hours over and not
 * logged, so one notice can say how far behind the log is.
 */
export function pendingCheckIn(
  entries: readonly ActivityEntry[],
  window: HoursWindow,
  now: Date,
  dismissed: string | null,
): PendingCheckIn | null {
  const slot = slotJustEnded(now)
  if (!isExpectedSlot(window, slot) || isSlotLogged(entries, slot) || dismissed === slotKey(slot)) return null

  const logged = loggedSlots(entries)
  const others = expectedHours(window)
    .map((hour) => ({ day: slot.day, hour }))
    .filter((other) => other.hour !== slot.hour && hasSlotEnded(other, now) && !logged.has(slotKey(other)))
  return { slot, others: others.length }
}

/** The day, hour and minute a clock shows in a time zone. */
export interface WallClock {
  readonly day: LocalDay
  readonly hour: number
  readonly minute: number
}

/**
 * What the clock reads at `now` in an IANA time zone — `Europe/Kyiv` — for the
 * sender that pushes a check-in to a device whose clock is not its own. Null for
 * a zone the platform does not know.
 */
export function wallClock(now: Date, timeZone: string): WallClock | null {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
  } catch {
    return null
  }

  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((each) => each.type === type)?.value ?? ''
  const day = `${part('year')}-${part('month')}-${part('day')}`
  const hour = Number(part('hour'))
  const minute = Number(part('minute'))
  if (!isLocalDay(day) || !Number.isInteger(hour) || !Number.isInteger(minute)) return null
  return { day, hour: hour % 24, minute }
}

/** How far into the next hour a check-in is still worth sending, should the first try be missed. */
export const CHECK_IN_SEND_MINUTES = 45

/**
 * The hour a check-in is due to be pushed about by the clock given, or null
 * (CHECKIN-10): the check-in is on, the hour that just ended is one kept to, it
 * is still early in the hour after it, and that hour was not pushed about
 * already. Whether anything is logged under it is the sender's to ask next.
 */
export function checkInSlotToSend(input: {
  readonly on: boolean
  readonly window: HoursWindow
  readonly clock: WallClock
  readonly lastSentSlot: string | null
}): HourSlot | null {
  const { on, window, clock, lastSentSlot } = input
  if (!on || clock.minute >= CHECK_IN_SEND_MINUTES) return null

  const slot = slotBefore({ day: clock.day, hour: clock.hour })
  if (!isExpectedSlot(window, slot) || lastSentSlot === slotKey(slot)) return null
  return slot
}
