/**
 * Hours of the day something keeps to — from one time of day to another, on
 * the owner's local clock: the hours the nudge may speak in (./nudge), and the
 * hours a check-in asks about (./checkIn).
 *
 * Written as two `LocalTime`s rather than a pair of moments, for the reason a
 * due time is (`LocalTime`): nine in the morning is nine in the morning wherever
 * the device is, and every day, where a stored moment would be one morning only.
 */

import { isLocalTime, toLocalTime, type LocalTime } from './day'

export interface HoursWindow {
  readonly from: LocalTime
  readonly to: LocalTime
}

export function isHoursWindow(value: unknown): value is HoursWindow {
  if (typeof value !== 'object' || value === null) return false
  const { from, to } = value as Partial<HoursWindow>
  return typeof from === 'string' && isLocalTime(from) && typeof to === 'string' && isLocalTime(to)
}

/**
 * Whether a time of day falls inside the hours.
 *
 * Hours whose end is **before** their start run past midnight, 22:00 to 07:00
 * being the night; hours whose two ends are the **same** are the whole day,
 * there being no time they shut out. Times compare as text, in clock order,
 * which is what writing them as `HH:MM` is for.
 */
export function isTimeWithinHours(window: HoursWindow, time: LocalTime): boolean {
  if (window.from === window.to) return true
  return window.from < window.to ? time >= window.from && time < window.to : time >= window.from || time < window.to
}

/** Whether `now` falls inside the hours — always, where there are none to keep to. */
export function isWithinHours(window: HoursWindow | null, now: Date = new Date()): boolean {
  return window === null || isTimeWithinHours(window, toLocalTime(now))
}
