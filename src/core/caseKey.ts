/**
 * The keys a day holds, and when the second one is there for the taking.
 *
 * A day has two keys (CHST-27). The first is earned the hard way: clear
 * everything in Today. The second is a bonus that becomes available at a
 * random moment during the day — the same moment for everyone, so it is
 * derived from the day rather than chosen per device. Monday has a third,
 * Weekly, ready from midnight and only planned again on Tuesday (CHST-30).
 *
 * The random moment is deterministic: a hash of the day's date picks an
 * hour and minute, so every device agrees on when the key arrives without
 * anything being stored. It falls between 06:00 and 21:59, so it lands in
 * waking hours.
 */

import { startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { CASE_DAILY_ID, CASE_TODAY_ID, CASE_WEEK_ID, isCaseEarning } from './cases'
import { summarize } from './progress'
import type { RewardEntry } from './reward'
import type { Task } from './task'
import type { CaseSettings } from './cases'

/**
 * How many cases a day can open before Monday. Monday can also open Weekly, so
 * that day holds one more (CHST-30).
 */
export const KEYS_PER_DAY = 2

/** The earliest the bonus key can arrive. */
export const KEY_HOUR_EARLIEST = 6

/** The latest the bonus key can arrive. */
export const KEY_HOUR_LATEST = 21

/** A day has two keys: one for clearing Today, one at a random moment. */
export type KeyWay = 'clear' | 'daily'

/** How many of the day's cases have been opened, one for each kind. */
export function keysOpened(entries: readonly RewardEntry[], now: Date = new Date()): number {
  const today = toLocalDay(now)
  const opened = new Set(entries.filter((entry) => entry.day === today && isCaseEarning(entry.taskId)).map((entry) => entry.taskId))
  return opened.size
}

/** Whether Today's case has already been opened. */
export function todayCaseOpened(entries: readonly RewardEntry[], now: Date = new Date()): boolean {
  const today = toLocalDay(now)
  return entries.some((entry) => entry.taskId === CASE_TODAY_ID && entry.day === today)
}

/** Whether the daily case has already been opened. */
export function dailyCaseOpened(entries: readonly RewardEntry[], now: Date = new Date()): boolean {
  const today = toLocalDay(now)
  return entries.some((entry) => entry.taskId === CASE_DAILY_ID && entry.day === today)
}

/** Whether Monday's Weekly has already been opened. */
export function weekCaseOpened(entries: readonly RewardEntry[], now: Date = new Date()): boolean {
  const today = toLocalDay(now)
  return entries.some((entry) => entry.taskId === CASE_WEEK_ID && entry.day === today)
}

/**
 * The moment the bonus key becomes available on a given day, derived from
 * the day itself so every device agrees. Deterministic: the same day always
 * yields the same moment.
 */
export function dailyKeyTime(day: LocalDay): Date {
  const start = startOfLocalDay(day)
  const hash = hashDay(day)

  // Pick an hour between KEY_HOUR_EARLIEST and KEY_HOUR_LATEST inclusive.
  const hourSpan = KEY_HOUR_LATEST - KEY_HOUR_EARLIEST + 1
  const hour = KEY_HOUR_EARLIEST + (hash % hourSpan)

  // Pick a minute from the remaining bits of the hash.
  const minute = Math.floor(hash / hourSpan) % 60

  return new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour, minute)
}

/**
 * A simple deterministic hash of the day string. Same input, same output —
 * that is what makes the random time agree across devices.
 */
function hashDay(day: LocalDay): number {
  let hash = 0
  for (let i = 0; i < day.length; i++) {
    hash = ((hash << 5) - hash + day.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Whether the bonus key is available right now: the day's random moment has
 * passed and the bonus key has not been opened yet.
 */
export function bonusKeyAvailable(entries: readonly RewardEntry[], now: Date = new Date()): boolean {
  const timeReached = now.getTime() >= dailyKeyTime(toLocalDay(now)).getTime()
  return timeReached && !dailyCaseOpened(entries, now)
}

/**
 * The moment the next key becomes available, for the countdown timer.
 *
 * Returns null when both keys have been opened, or when the only remaining
 * key is the clear-Today one (which has no timer — it is earned by doing,
 * not by waiting). Returns the bonus key's random time when that is what
 * the user is waiting for.
 */
export function nextKeyTime(
  _tasks: readonly Task[],
  entries: readonly RewardEntry[],
  _settings: CaseSettings,
  now: Date = new Date(),
): { at: Date; way: KeyWay } | null {
  if (dailyCaseOpened(entries, now)) return null

  const at = dailyKeyTime(toLocalDay(now))
  if (now.getTime() >= at.getTime()) return null
  return { at, way: 'daily' }
}

/**
 * Whether any key is available right now: either the day is clear or the
 * bonus time has passed, and at least one key remains unopened.
 */
export function anyKeyAvailable(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: CaseSettings,
  now: Date = new Date(),
): boolean {
  const held = now.getDay() === 1 ? KEYS_PER_DAY + 1 : KEYS_PER_DAY
  if (keysOpened(entries, now) >= held) return false

  // Is the day clear?
  const { total, remaining } = summarize(tasks, 'today', now)
  const dayCleared = total > 0 && remaining === 0 && total >= settings.leastTasks

  if (dayCleared) return true
  // Weekly is ready from midnight on Monday, with nothing else to wait for.
  if (now.getDay() === 1 && !weekCaseOpened(entries, now)) return true

  // Has the bonus time passed?
  return bonusKeyAvailable(entries, now)
}
