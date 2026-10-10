/**
 * The activity log: what the owner did, hour by hour — "Reading 15m" at two in
 * the afternoon, "Work 1h 20m" at three — kept apart from the tasks, so a day
 * can be looked back on as it was spent rather than as what was ticked off
 * (ACT-1).
 *
 * A record belongs to one **hour of a day** — its slot — and says how long went
 * on what. The slot is a local day and an hour of its clock, written the way a
 * due date is (./day): two in the afternoon on the 2nd stays that, wherever the
 * record is read. A record may be longer than its hour; it is what was logged
 * there, caught up later or not.
 *
 * An activity is a name and nothing else: typed, and remembered from the
 * records that carry it. Two records name the same activity whatever case they
 * are written in, so "Reading" and "reading" are added up together.
 *
 * Time logged on a task is written here too (ACT-21): the time up to the moment
 * it was logged, under the task's title, cut at the hours it crosses. Those
 * records know when they began, and which session they are from, so taking the
 * session back takes them out with it.
 */

import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { periodRange } from './progress'
import type { TaskId } from './task'
import { isSessionSeconds, type TimeEntry, type TimeEntryId } from './timeLog'

export type ActivityEntryId = string

/** The task session a record was made from (ACT-21). */
export interface SessionRef {
  readonly taskId: TaskId
  readonly entryId: TimeEntryId
}

export interface ActivityEntry {
  readonly id: ActivityEntryId
  /** What was done, as it was written: `Reading`. */
  readonly activity: string
  /** How long, in whole seconds from 1 to a day (`isSessionSeconds`). Typed, always whole minutes. */
  readonly seconds: number
  /** The local day of the hour it is logged under. */
  readonly day: LocalDay
  /** The hour of that day's clock it is logged under, 0 to 23. */
  readonly hour: number
  /**
   * The second of its hour it began at, 0 to 3599 (`isStartSecond`), when that
   * is known — a session's records know it (ACT-21) — or null for one typed.
   */
  readonly startSecond: number | null
  /** The task session it was made from, or null for one typed. */
  readonly session: SessionRef | null
  /** ISO 8601: when it was written down or last changed. */
  readonly loggedAt: string
}

/** One hour of one local day — the hour a record is logged under, and the one a check-in asks about. */
export interface HourSlot {
  readonly day: LocalDay
  readonly hour: number
}

/** As long a name as an activity is given room for on screen. */
export const MAX_ACTIVITY_NAME_LENGTH = 40

const HOUR_SECONDS = 3600

export class InvalidActivityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidActivityError'
  }
}

/** Whether a value is an hour of the day's clock: a whole number from 0 to 23. */
export function isHourOfDay(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23
}

/** Whether a value is a second of an hour a record can begin at: a whole number from 0 to 3599. */
export function isStartSecond(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < HOUR_SECONDS
}

function squeezed(name: string): string {
  return name.trim().replace(/\s+/gu, ' ')
}

/** Whether `name` can name an activity: something other than space, on one line, short enough to read. */
export function isActivityName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_ACTIVITY_NAME_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** The stored form of an activity's name: trimmed, with the spaces inside it squeezed to one. */
export function normalizeActivityName(name: string): string {
  const normalized = squeezed(name)
  if (!isActivityName(normalized)) {
    throw new InvalidActivityError(
      `"${name}" is not an activity: an activity needs a name, on one line, of at most ${String(MAX_ACTIVITY_NAME_LENGTH)} characters.`,
    )
  }
  return normalized
}

/** What two names of one activity have in common: the name squeezed and in lower case. */
export function activityKey(name: string): string {
  return squeezed(name).toLowerCase()
}

/** Whether two names are the same activity, whatever case they are written in. */
export function sameActivity(a: string, b: string): boolean {
  return activityKey(a) === activityKey(b)
}

/** `2026-10-02T14`: a slot as text, sorting in time order. */
export function slotKey(slot: HourSlot): string {
  return `${slot.day}T${String(slot.hour).padStart(2, '0')}`
}

export function slotOf(entry: ActivityEntry): HourSlot {
  return { day: entry.day, hour: entry.hour }
}

export function sameSlot(a: HourSlot, b: HourSlot): boolean {
  return a.day === b.day && a.hour === b.hour
}

/** The slot `now` falls in: this hour of today. */
export function slotAt(now: Date): HourSlot {
  return { day: toLocalDay(now), hour: now.getHours() }
}

/** The hour before, across midnight into the day before. */
export function slotBefore(slot: HourSlot): HourSlot {
  return slot.hour === 0 ? { day: offsetDay(slot.day, -1), hour: 23 } : { day: slot.day, hour: slot.hour - 1 }
}

/** The local moment the slot begins. */
export function slotStart(slot: HourSlot): Date {
  const start = startOfLocalDay(slot.day)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate(), slot.hour)
}

/** The local moment the slot is over: the start of the hour after it. */
export function slotEnd(slot: HourSlot): Date {
  const start = startOfLocalDay(slot.day)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate(), slot.hour + 1)
}

/** Whether the slot has begun by `now` — a record can be logged under it. */
export function hasSlotStarted(slot: HourSlot, now: Date): boolean {
  return slotStart(slot).getTime() <= now.getTime()
}

/** Whether the slot is over by `now`. */
export function hasSlotEnded(slot: HourSlot, now: Date): boolean {
  return slotEnd(slot).getTime() <= now.getTime()
}

/**
 * A record of `seconds` on `activity` under the slot. A name an earlier record
 * already carries keeps the spelling it has there — `known` is every activity
 * there is — as a tag does on a task.
 */
export function createActivityEntry(
  activity: string,
  seconds: number,
  slot: HourSlot,
  now: Date = new Date(),
  known: readonly string[] = [],
): ActivityEntry {
  if (!isSessionSeconds(seconds)) {
    throw new InvalidActivityError(`${String(seconds)} is not a length for a record: from a second to a day.`)
  }
  return {
    id: crypto.randomUUID(),
    activity: spelled(normalizeActivityName(activity), known),
    seconds,
    day: slot.day,
    hour: slot.hour,
    startSecond: null,
    session: null,
    loggedAt: now.toISOString(),
  }
}

/**
 * The activity a task's time is logged as (ACT-21): its title on one line,
 * cut to the length a name can be, with an ellipsis where it was cut.
 */
export function activityNameOf(title: string): string {
  const name = squeezed(title)
  if (name.length <= MAX_ACTIVITY_NAME_LENGTH) return name
  // Never half of a character written in two.
  const cut = name.slice(0, MAX_ACTIVITY_NAME_LENGTH - 1).replace(/[\uD800-\uDBFF]$/u, '')
  return `${cut.trimEnd()}…`
}

/**
 * The records a session logged on a task makes in the log (ACT-21): the time
 * up to the moment it was logged — its length back from then, as a timer's run
 * is from its start to its stop — under the task's title, spelled as the
 * activity is known. It is cut at every hour it crosses, so each hour is given
 * what was spent in it, and each record knows when it began and the session it
 * is from. The moment is taken to the whole second, so the pieces add up to
 * the session exactly.
 */
export function sessionActivityEntries(
  title: string,
  taskId: TaskId,
  session: TimeEntry,
  now: Date = new Date(),
  known: readonly string[] = [],
): ActivityEntry[] {
  const activity = spelled(activityNameOf(title), known)
  const end = Math.round(Date.parse(session.loggedAt) / 1000) * 1000
  const entries: ActivityEntry[] = []

  for (let start = end - session.seconds * 1000; start < end; ) {
    const slot = slotAt(new Date(start))
    const hourEnd = slotEnd(slot).getTime()
    // An hour a clock change has bent out of shape still ends somewhere ahead.
    const until = hourEnd > start ? Math.min(hourEnd, end) : end
    const seconds = Math.round((until - start) / 1000)
    const startSecond = Math.floor((start - slotStart(slot).getTime()) / 1000)
    if (isSessionSeconds(seconds)) {
      entries.push({
        id: crypto.randomUUID(),
        activity,
        seconds,
        day: slot.day,
        hour: slot.hour,
        startSecond: isStartSecond(startSecond) ? startSecond : null,
        session: { taskId, entryId: session.id },
        loggedAt: now.toISOString(),
      })
    }
    start = until
  }
  return entries
}

/** The log without the records made from a session, for when the session is taken back (ACT-21). */
export function withoutSession(entries: readonly ActivityEntry[], entryId: TimeEntryId): ActivityEntry[] {
  return entries.filter((entry) => entry.session?.entryId !== entryId)
}

/**
 * The log with a session's records written again for the length it was changed
 * to (TIME-24, ACT-21): the records it made go, as changed or moved as they may
 * be, and its time up to the moment it was logged is cut into hours afresh,
 * under the task's title. A session none of whose records is left — taken out
 * of the log by hand — stays out of it: the log is left as it is.
 */
export function withSessionResized(
  entries: readonly ActivityEntry[],
  title: string,
  taskId: TaskId,
  session: TimeEntry,
  now: Date = new Date(),
  known: readonly string[] = [],
): ActivityEntry[] {
  if (!entries.some((entry) => entry.session?.entryId === session.id)) return [...entries]
  return [...withoutSession(entries, session.id), ...sessionActivityEntries(title, taskId, session, now, known)]
}

/**
 * When a record began and ended, by its hour and the second of it it began at,
 * or null for one that does not know (ACT-21). It ends its length later, so a
 * record changed or moved keeps beginning as far into its hour as it did.
 */
export function entryTimes(entry: ActivityEntry): { readonly start: Date; readonly end: Date } | null {
  if (entry.startSecond === null) return null
  const start = new Date(slotStart(slotOf(entry)).getTime() + entry.startSecond * 1000)
  return { start, end: new Date(start.getTime() + entry.seconds * 1000) }
}

/** What a record can be changed to: what, how long, and the hour of its day. */
export interface ActivityChange {
  readonly activity: string
  readonly seconds: number
  readonly hour: number
}

/**
 * The record changed. Returns a new record; the one passed in is never
 * modified, and is handed back as it is when nothing changes.
 */
export function changeActivityEntry(
  entry: ActivityEntry,
  change: ActivityChange,
  now: Date = new Date(),
  known: readonly string[] = [],
): ActivityEntry {
  if (!isSessionSeconds(change.seconds) || !isHourOfDay(change.hour)) {
    throw new InvalidActivityError('A record is a second to a day long, under an hour from 0 to 23.')
  }
  const normalized = normalizeActivityName(change.activity)
  // Respelled by hand, it is spelled as typed; otherwise as it is known.
  const activity = sameActivity(normalized, entry.activity) ? normalized : spelled(normalized, known)
  if (activity === entry.activity && change.seconds === entry.seconds && change.hour === entry.hour) return entry

  return { ...entry, activity, seconds: change.seconds, hour: change.hour, loggedAt: now.toISOString() }
}

function spelled(name: string, known: readonly string[]): string {
  return known.find((other) => sameActivity(other, name)) ?? name
}

/** The records logged under the slot, in the order they were written down. */
export function entriesInSlot(entries: readonly ActivityEntry[], slot: HourSlot): ActivityEntry[] {
  return entries
    .filter((entry) => entry.day === slot.day && entry.hour === slot.hour)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt) || a.id.localeCompare(b.id))
}

/** Whether anything is logged under the slot. */
export function isSlotLogged(entries: readonly ActivityEntry[], slot: HourSlot): boolean {
  return entries.some((entry) => entry.day === slot.day && entry.hour === slot.hour)
}

/** The keys of every slot something is logged under, to ask of many slots at once. */
export function loggedSlots(entries: readonly ActivityEntry[]): Set<string> {
  return new Set(entries.map((entry) => slotKey(slotOf(entry))))
}

/** How long recent use is counted back when ranking the activities offered (ACT-4). */
const RECENT_DAYS = 30

/**
 * Every activity there is, once each, spelled as it was last written, the ones
 * used most these last thirty days first, then the ones used most lately — the
 * order they are offered in while typing (ACT-4).
 */
export function knownActivities(entries: readonly ActivityEntry[], now: Date = new Date()): string[] {
  const since = offsetDay(toLocalDay(now), -(RECENT_DAYS - 1))
  const seen = new Map<string, { name: string; latest: string; recent: number }>()

  for (const entry of entries) {
    const key = activityKey(entry.activity)
    const known = seen.get(key) ?? { name: entry.activity, latest: '', recent: 0 }
    if (entry.loggedAt > known.latest) {
      known.name = entry.activity
      known.latest = entry.loggedAt
    }
    if (entry.day >= since) known.recent += 1
    seen.set(key, known)
  }

  return [...seen.values()]
    .sort((a, b) => b.recent - a.recent || b.latest.localeCompare(a.latest) || a.name.localeCompare(b.name))
    .map((known) => known.name)
}

/**
 * The activities offered for what has been typed: one of that name first, then
 * those it starts, then those it is anywhere in — each run in the order given
 * (`knownActivities`). Nothing typed offers the first of them all.
 */
export function suggestActivities(known: readonly string[], query: string, limit = 6): string[] {
  const typed = activityKey(query)
  const rank = (name: string) => {
    const key = activityKey(name)
    if (key === typed) return 0
    return key.startsWith(typed) ? 1 : 2
  }

  return known
    .filter((name) => activityKey(name).includes(typed))
    .map((name, index) => ({ name, index, rank: rank(name) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map(({ name }) => name)
}

/** An activity as the charts know it: what its records have in common, and how it is spelled. */
export interface ActivityKind {
  readonly key: string
  /** As it was last written. */
  readonly name: string
}

/**
 * Every activity there is, in the order each was first logged under — the
 * order the charts draw them in and give out their colours by, so an activity
 * keeps its colour whatever period is shown (ACT-16).
 */
export function activityKinds(entries: readonly ActivityEntry[]): ActivityKind[] {
  const kinds = new Map<string, { name: string; latest: string; first: string }>()
  for (const entry of entries) {
    const key = activityKey(entry.activity)
    const at = `${slotKey(slotOf(entry))}|${entry.loggedAt}`
    const kind = kinds.get(key) ?? { name: entry.activity, latest: '', first: at }
    if (entry.loggedAt > kind.latest) {
      kind.name = entry.activity
      kind.latest = entry.loggedAt
    }
    if (at < kind.first) kind.first = at
    kinds.set(key, kind)
  }

  return [...kinds.entries()]
    .sort(([keyA, a], [keyB, b]) => a.first.localeCompare(b.first) || keyA.localeCompare(keyB))
    .map(([key, kind]) => ({ key, name: kind.name }))
}

export interface ActivityTotal {
  readonly kind: ActivityKind
  readonly seconds: number
}

export interface ActivityTotals {
  /** Every kind given, in the order given, with the seconds logged on it — none included. */
  readonly activities: readonly ActivityTotal[]
  /** Every second logged. */
  readonly total: number
}

/** One day's share, as `activityByDay` hands them out. */
export interface DayActivity extends ActivityTotals {
  readonly day: LocalDay
}

function totalsOf(kinds: readonly ActivityKind[], seconds: ReadonlyMap<string, number>): ActivityTotals {
  const activities = kinds.map((kind) => ({ kind, seconds: seconds.get(kind.key) ?? 0 }))
  return { activities, total: activities.reduce((sum, { seconds: each }) => sum + each, 0) }
}

/** How the records logged on the days from `from` to `to`, both included, add up per activity. */
export function activityTotals(
  entries: readonly ActivityEntry[],
  kinds: readonly ActivityKind[],
  from: LocalDay,
  to: LocalDay,
): ActivityTotals {
  const seconds = new Map<string, number>()
  for (const entry of entries) {
    if (entry.day < from || entry.day > to) continue
    const key = activityKey(entry.activity)
    seconds.set(key, (seconds.get(key) ?? 0) + entry.seconds)
  }
  return totalsOf(kinds, seconds)
}

/** The days given, in order, each with what its records add up to — days with nothing logged too. */
export function activityByDay(
  entries: readonly ActivityEntry[],
  kinds: readonly ActivityKind[],
  days: readonly LocalDay[],
): DayActivity[] {
  const byDay = new Map(days.map((day) => [day, new Map<string, number>()]))
  for (const entry of entries) {
    const seconds = byDay.get(entry.day)
    if (seconds === undefined) continue
    const key = activityKey(entry.activity)
    seconds.set(key, (seconds.get(key) ?? 0) + entry.seconds)
  }
  return days.map((day) => ({ day, ...totalsOf(kinds, byDay.get(day) ?? new Map<string, number>()) }))
}

/** A period the log is read over: a day, its week (Monday to Sunday), or its month. */
export type ActivityPeriod = 'day' | 'week' | 'month'

/** Every local day of the period `anchor` falls in, in order. */
export function activityPeriodDays(period: ActivityPeriod, anchor: LocalDay): LocalDay[] {
  if (period === 'day') return [anchor]

  const { start, end } = periodRange(period, startOfLocalDay(anchor))
  const days: LocalDay[] = []
  for (let day = toLocalDay(start); startOfLocalDay(day) < end; day = offsetDay(day, 1)) days.push(day)
  return days
}

/**
 * A day in the period `steps` away from the one `anchor` falls in — the next
 * day, week or month for 1, the one before for -1. A month is stepped to its
 * first day, so the 31st never lands in the month after next.
 */
export function shiftActivityPeriod(period: ActivityPeriod, anchor: LocalDay, steps: number): LocalDay {
  if (period === 'day') return offsetDay(anchor, steps)
  if (period === 'week') return offsetDay(anchor, steps * 7)

  const start = startOfLocalDay(anchor)
  return toLocalDay(new Date(start.getFullYear(), start.getMonth() + steps, 1))
}
