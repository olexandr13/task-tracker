/**
 * Where the time went: logged time divided between categories the owner names
 * themselves — Work, Chores, Rest, any number of them — so a day spent all on
 * one of them shows as that (BAL-1).
 *
 * A category is **bound to tags** that already exist, and holds nothing else of
 * its own: a task's logged time counts toward a category when the task carries
 * one of its tags. So a task is put in a category the way it is put anywhere
 * else, by tagging it, and a category never has to be chosen on the task.
 *
 * A category keeps the tags **by name**, as a task does (./tag), so renaming or
 * deleting a tag is written through to the categories the same way it is
 * written through to the tasks.
 *
 * The totals come from every session a task keeps, not only those counting for
 * its occurrence: a daily walk logged on Monday is still Monday's rest on
 * Wednesday. How long sessions are kept is ./timeLog's (`TIME_HISTORY_DAYS`).
 *
 * Time can also be logged **straight to a category**, with no task behind it
 * (BAL-14): an evening's reading logged to Rest. Such sessions are the
 * category's own, kept on it the way a task keeps its sessions, for as long as
 * the page can show them, and they count toward it whole.
 */

import { offsetDay, startOfLocalDay, toLocalDay, type LocalDay } from './day'
import { periodRange, type Period } from './progress'
import { distinctTags, normalizeTag, sameTag } from './tag'
import type { Task } from './task'
import { historyEntries, minutesEntry, type TimeEntry, type TimeEntryId } from './timeLog'

export type CategoryId = string

export interface Category {
  readonly id: CategoryId
  /** What it is called, as it was written: `Work`, `Rest`. */
  readonly name: string
  /** The tags whose tasks' time counts toward it, each once, alphabetically. */
  readonly tags: readonly string[]
  /**
   * Sessions logged straight to it, with no task behind them (BAL-14), oldest
   * first: only those recent enough for the page to show (`historyEntries`).
   */
  readonly timeLog: readonly TimeEntry[]
  /** ISO 8601 timestamp. */
  readonly createdAt: string
}

/** As long a name as a category is given room for on screen. */
export const MAX_CATEGORY_NAME_LENGTH = 40

/**
 * The most categories there can be: one for each colour the chart has, so no
 * two are ever told apart by a colour made up on the spot (BAL-7).
 */
export const MAX_CATEGORIES = 8

export class InvalidCategoryError extends Error {
  constructor(name: string) {
    super(
      `"${name}" is not a category name: a category needs a name, on one line, of at most ${String(MAX_CATEGORY_NAME_LENGTH)} characters.`,
    )
    this.name = 'InvalidCategoryError'
  }
}

function squeezed(name: string): string {
  return name.trim().replace(/\s+/gu, ' ')
}

/** Whether `name` can name a category: something other than space, on one line, short enough to read. */
export function isCategoryName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_CATEGORY_NAME_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** The stored form of a category's name: trimmed, with the spaces inside it squeezed to one. */
export function normalizeCategoryName(name: string): string {
  const normalized = squeezed(name)
  if (!isCategoryName(normalized)) throw new InvalidCategoryError(name)
  return normalized
}

/** Whether there are as many categories as there can be (BAL-7). */
export function isCategoryLimitReached(categories: readonly Category[]): boolean {
  return categories.length >= MAX_CATEGORIES
}

/** A category of the given name, bound to no tag yet and with no time logged to it. */
export function createCategory(name: string, now: Date = new Date()): Category {
  return { id: crypto.randomUUID(), name: normalizeCategoryName(name), tags: [], timeLog: [], createdAt: now.toISOString() }
}

/** Whether any category is called this already, whatever its case — `except` aside, which is its own. */
export function isCategoryNameTaken(
  categories: readonly Category[],
  name: string,
  except: CategoryId | null = null,
): boolean {
  const wanted = squeezed(name).toLowerCase()
  return categories.some((category) => category.id !== except && category.name.toLowerCase() === wanted)
}

/**
 * Renames a category. Returns a new category; the one passed in is never
 * modified, and is handed back as it is when the name does not change.
 */
export function renameCategory(category: Category, name: string): Category {
  const renamed = normalizeCategoryName(name)
  return renamed === category.name ? category : { ...category, name: renamed }
}

/**
 * Binds a tag to the category, so the time of every task carrying it counts
 * there. A name already known — `known` is every tag there is — keeps the
 * spelling it has there, as on a task (`addTag`). A category bound to it already
 * is handed back as it is.
 */
export function bindTag(category: Category, name: string, known: readonly string[] = []): Category {
  const bare = normalizeTag(name)
  if (category.tags.some((tag) => sameTag(tag, bare))) return category

  const spelled = known.find((tag) => sameTag(tag, bare)) ?? bare
  return { ...category, tags: distinctTags([...category.tags, spelled]) }
}

/** Unbinds a tag, whatever case it is named in. A category without it is handed back as it is. */
export function unbindTag(category: Category, name: string): Category {
  const kept = category.tags.filter((tag) => !sameTag(tag, name))
  return kept.length === category.tags.length ? category : { ...category, tags: kept }
}

/**
 * A tag renamed (TAG-24), written through to every category bound to it, which
 * stays bound under the new name (BAL-11). A category bound to both names is
 * left with the tag once. One without the tag is handed back as it was, so only
 * the ones that change are saved.
 */
export function renameTagInCategories(categories: readonly Category[], from: string, to: string): Category[] {
  const name = normalizeTag(to)

  return categories.map((category) => {
    if (!category.tags.some((tag) => sameTag(tag, from))) return category
    return { ...category, tags: distinctTags(category.tags.map((tag) => (sameTag(tag, from) ? name : tag))) }
  })
}

/**
 * A tag deleted (TAG-22), unbound from every category bound to it (BAL-11).
 * One without the tag is handed back as it was.
 */
export function removeTagFromCategories(categories: readonly Category[], name: string): Category[] {
  return categories.map((category) => unbindTag(category, name))
}

/**
 * The categories in the order they are shown: the order they were made in, so
 * a new one joins at the end and a renamed one stays where it was — with the
 * colour it wears (BAL-6) — and then by id, so two merged devices never leave
 * it to chance. Returns a new array.
 */
export function sortCategories(categories: readonly Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const byAge = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (byAge !== 0) return byAge
    if (a.id === b.id) return 0
    return a.id < b.id ? -1 : 1
  })
}

export function findCategory(categories: readonly Category[], id: CategoryId): Category | null {
  return categories.find((category) => category.id === id) ?? null
}

/**
 * Logs a session of whole minutes straight to the category, with what it went
 * on when that is said (BAL-14). Sessions too old for any period the page shows
 * are let go of as it is logged, as a task lets go of its history (TIME-8).
 *
 * Returns a new category; the one passed in is never modified.
 */
export function logCategoryTime(
  category: Category,
  minutes: number,
  now: Date = new Date(),
  comment: string | null = null,
): Category {
  const entry = minutesEntry(minutes, now, comment)
  return { ...category, timeLog: [...historyEntries(category.timeLog, now), entry] }
}

/**
 * Takes back a session logged straight to the category (BAL-15). One without
 * it is handed back as it is.
 *
 * Returns a new category; the one passed in is never modified.
 */
export function removeCategoryTime(category: Category, entryId: TimeEntryId): Category {
  const kept = category.timeLog.filter((entry) => entry.id !== entryId)
  return kept.length === category.timeLog.length ? category : { ...category, timeLog: kept }
}

/**
 * The sessions logged straight to the category that the page still shows as of
 * `now`, the latest first (BAL-15): an older one counts in no period any more.
 */
export function recentCategoryTime(category: Category, now: Date = new Date()): TimeEntry[] {
  return historyEntries(category.timeLog, now).reverse()
}

export interface CategoryTotal {
  readonly category: Category
  readonly seconds: number
}

export interface BalanceTotals {
  /** Each category, in the order given, with the seconds logged toward it. */
  readonly categories: readonly CategoryTotal[]
  /** Seconds logged on tasks none of whose tags is bound to any category (BAL-5). */
  readonly other: number
  /** Every second logged, the categories and other added up (BAL-5). */
  readonly total: number
}

/** One day's share of a period, as `balanceByDay` hands them out. */
export interface DayBalance extends BalanceTotals {
  readonly day: LocalDay
}

/** Seconds counted so far: per category, other, and the total. */
interface Tally {
  readonly seconds: Map<CategoryId, number>
  other: number
  total: number
}

function emptyTally(categories: readonly Category[]): Tally {
  return { seconds: new Map(categories.map((category) => [category.id, 0])), other: 0, total: 0 }
}

function totalsOf(categories: readonly Category[], tally: Tally): BalanceTotals {
  return {
    categories: categories.map((category) => ({ category, seconds: tally.seconds.get(category.id) ?? 0 })),
    other: tally.other,
    total: tally.total,
  }
}

/** The categories one of the task's tags is bound to, in the order given. */
function boundCategories(categories: readonly Category[], task: Task): Category[] {
  return categories.filter((category) =>
    category.tags.some((tag) => task.tags.some((carried) => sameTag(carried, tag))),
  )
}

/**
 * Counts a session: divided evenly between the categories its task is bound to
 * (BAL-4), or as other when it is bound to none (BAL-5). The pieces always add
 * up to the session, so the total is every second once.
 */
function count(tally: Tally, bound: readonly Category[], seconds: number): void {
  tally.total += seconds
  if (bound.length === 0) {
    tally.other += seconds
    return
  }

  const share = seconds / bound.length
  for (const category of bound) tally.seconds.set(category.id, (tally.seconds.get(category.id) ?? 0) + share)
}

/**
 * How the time logged in the period divides between the categories (BAL-3,
 * BAL-4, BAL-5, BAL-14). Every session every task keeps counts — tasks in the
 * trash too, and sessions from a repeating task's occurrences gone by — where
 * it was logged within the period. A task bound to more than one category has
 * its time divided evenly between them, so the categories and other add up to
 * the total; time on a task bound to none counts as other. A session logged
 * straight to a category counts toward it whole.
 */
export function balanceTotals(
  categories: readonly Category[],
  tasks: readonly Task[],
  period: Period,
  now: Date = new Date(),
): BalanceTotals {
  const { start, end } = periodRange(period, now)
  const tally = emptyTally(categories)

  for (const task of tasks) {
    const bound = boundCategories(categories, task)
    for (const entry of task.timeLog) {
      const at = new Date(entry.loggedAt)
      if (at >= start && at < end) count(tally, bound, entry.seconds)
    }
  }

  for (const category of categories) {
    for (const entry of category.timeLog) {
      const at = new Date(entry.loggedAt)
      if (at >= start && at < end) count(tally, [category], entry.seconds)
    }
  }

  return totalsOf(categories, tally)
}

/**
 * The period day by day (BAL-13): every local day in it, in order, those with
 * nothing logged too, each divided between the categories as the period is —
 * time logged straight to a category among it (BAL-14).
 */
export function balanceByDay(
  categories: readonly Category[],
  tasks: readonly Task[],
  period: Period,
  now: Date = new Date(),
): DayBalance[] {
  const { start, end } = periodRange(period, now)
  const days: LocalDay[] = []
  for (let day = toLocalDay(start); startOfLocalDay(day) < end; day = offsetDay(day, 1)) days.push(day)

  const tallies = new Map(days.map((day) => [day, emptyTally(categories)]))
  for (const task of tasks) {
    const bound = boundCategories(categories, task)
    for (const entry of task.timeLog) {
      const tally = tallies.get(toLocalDay(new Date(entry.loggedAt)))
      if (tally !== undefined) count(tally, bound, entry.seconds)
    }
  }

  for (const category of categories) {
    for (const entry of category.timeLog) {
      const tally = tallies.get(toLocalDay(new Date(entry.loggedAt)))
      if (tally !== undefined) count(tally, [category], entry.seconds)
    }
  }

  return days.map((day) => ({ day, ...totalsOf(categories, tallies.get(day) ?? emptyTally(categories)) }))
}

/** One session behind a piece of the chart, as `balanceSessions` lists them (BAL-16). */
export interface BalanceSession {
  readonly entry: TimeEntry
  /** The task it was logged on, or null for time logged straight to the category (BAL-14). */
  readonly task: Task | null
  /** What it counts toward the piece: the whole session, or its even share of it (BAL-4). */
  readonly seconds: number
  /** The other categories the session is divided with, in the order given; none when it counts whole. */
  readonly sharedWith: readonly Category[]
}

/**
 * The sessions behind one piece of the period's chart (BAL-16), the latest
 * first: those on tasks bound to the category — or, for null, those on tasks
 * bound to none, which are Other (BAL-5) — each with the part of it counted
 * there, and those logged straight to the category (BAL-14). They add up to
 * the piece, as the pieces add up to the total.
 */
export function balanceSessions(
  categories: readonly Category[],
  tasks: readonly Task[],
  categoryId: CategoryId | null,
  period: Period,
  now: Date = new Date(),
): BalanceSession[] {
  const { start, end } = periodRange(period, now)
  const inPeriod = (entry: TimeEntry) => {
    const at = new Date(entry.loggedAt)
    return at >= start && at < end
  }
  const sessions: BalanceSession[] = []

  for (const task of tasks) {
    const bound = boundCategories(categories, task)
    const counted = categoryId === null ? bound.length === 0 : bound.some((category) => category.id === categoryId)
    if (!counted) continue

    const sharedWith = bound.filter((category) => category.id !== categoryId)
    for (const entry of task.timeLog.filter(inPeriod)) {
      sessions.push({ entry, task, seconds: entry.seconds / Math.max(1, bound.length), sharedWith })
    }
  }

  const category = categoryId === null ? null : findCategory(categories, categoryId)
  for (const entry of category?.timeLog.filter(inPeriod) ?? []) {
    sessions.push({ entry, task: null, seconds: entry.seconds, sharedWith: [] })
  }

  return sessions.sort((a, b) => new Date(b.entry.loggedAt).getTime() - new Date(a.entry.loggedAt).getTime())
}

/**
 * The share of the total each amount is, in whole percent, adding up to exactly
 * 100 when anything was logged (BAL-6): each is rounded down, and the points
 * left over go to the largest remainders, the earlier first on a tie. All 0
 * when nothing was logged.
 */
export function balanceShares(seconds: readonly number[], total: number): number[] {
  if (total <= 0) return seconds.map(() => 0)

  const exact = seconds.map((amount) => (amount / total) * 100)
  const shares = exact.map((share) => Math.floor(share))
  const left = 100 - shares.reduce((sum, share) => sum + share, 0)
  const byRemainder = exact
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (const { index } of byRemainder.slice(0, Math.max(0, left))) shares[index] += 1

  return shares
}
