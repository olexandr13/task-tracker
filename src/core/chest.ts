/**
 * The chest: what a cleared day is worth when the amount is a surprise (CHST-1).
 *
 * A task's reward pays a known amount for a known piece of work, and a period
 * bonus (./bonus) pays a known amount for clearing a stretch of it. This pays an
 * **unknown** amount for clearing today — any whole number from 1 up to
 * everything earned today, each as likely as any other — so that finishing the
 * day is worth coming back to rather than worth a number already known before
 * the day began.
 *
 * Clearing Today earns one **key**, and the key opens one chest. Like a bonus,
 * what a chest gives rides in the same ledger as every completion (./reward),
 * under an id of its own — so it counts towards the balance and the period
 * tiles, shows among the earnings, and stays earned whatever becomes of the
 * tasks that earned it. The ledger names an entry by its task and its day, so
 * that id and the day are together the record of the chest being opened: one a
 * day, counted once however many devices saw it.
 *
 * Nothing here is stored but the one setting. Whether a key is waiting is
 * derived from the tasks as they stand and the ledger as it stands, the same
 * question the progress bars already answer (./progress).
 */

import { toLocalDay } from './day'
import { summarize } from './progress'
import type { RewardEntry } from './reward'
import type { Task, TaskId } from './task'

/** What one opening gave. */
export interface ChestOpen {
  /** What it paid: a whole number of points, from 1 to the jackpot. */
  readonly points: number
  /** What it was playing for, as it stood when the chest was opened. */
  readonly jackpot: number
}

/**
 * The least a chest can pay (CHST-11) — and so also the least the jackpot itself
 * can be (CHST-9): a chest that could give 1 point at best and 0 at worst would
 * be a chest that could be empty.
 */
export const MIN_CHEST_POINTS = 1

/**
 * What an opening is recorded under in place of a task, as a bonus is
 * (`BONUS_IDS`). Tasks are named by `crypto.randomUUID()`, so this is no task's
 * id and never will be.
 */
export const CHEST_ID: TaskId = 'chest-open'

/** What a day has to be before it earns a key. */
export interface ChestSettings {
  /**
   * How many tasks the day has to have asked for. A day with fewer earns no key
   * however clear it is, so a single thing remembered at nine in the evening is
   * not a day's work.
   */
  readonly leastTasks: number
}

export const MIN_LEAST_TASKS = 1
export const MAX_LEAST_TASKS = 99

/** What an account starts with: any cleared day earns a key. */
export const DEFAULT_CHEST: ChestSettings = { leastTasks: MIN_LEAST_TASKS }

/** Whether a day can be asked for this many tasks before it earns a key. */
export function isLeastTasks(tasks: number): boolean {
  return Number.isInteger(tasks) && tasks >= MIN_LEAST_TASKS && tasks <= MAX_LEAST_TASKS
}

/** Why there is no key to be had just now, or null while one is waiting. */
export type ChestBlock = 'opened' | 'unclear' | 'tooSmall'

/**
 * Opens a chest: a whole number from 1 to the jackpot, every one of them as
 * likely as any other (CHST-10). `random` is injectable so a test can say what
 * it gets.
 */
export function openChest(jackpot: number, random: () => number = Math.random): ChestOpen {
  const most = Math.max(MIN_CHEST_POINTS, Math.floor(jackpot))
  const points = Math.min(most, MIN_CHEST_POINTS + Math.floor(random() * (most - MIN_CHEST_POINTS + 1)))

  return { points, jackpot: most }
}

/**
 * The most a chest can give, as the ledger stands (CHST-7): **everything earned
 * today** — what the tasks earned and any bonus paid today, the same sum the
 * Today tile of what was earned shows (RWD-20) — leaving out only the chest's
 * own opening, which cannot be part of what it plays for. Never less than the
 * least a chest gives, so a day that earned nothing yet plays for 1.
 */
export function chestJackpot(entries: readonly RewardEntry[], now: Date = new Date()): number {
  const today = toLocalDay(now)
  const earned = entries.reduce((sum, entry) => (entry.day === today && entry.taskId !== CHEST_ID ? sum + entry.points : sum), 0)

  return Math.max(MIN_CHEST_POINTS, earned)
}

/**
 * Which quarter of the jackpot an opening came to, from 1 to 4: up to a quarter
 * of it is the first, more than three quarters the fourth. What colour its card
 * is (CHST-15); never what it pays, which is drawn without it.
 */
export type ChestQuarter = 1 | 2 | 3 | 4

/** The quarters, lowest first. */
export const CHEST_QUARTERS: readonly ChestQuarter[] = [1, 2, 3, 4]

export function chestQuarter(points: number, jackpot: number): ChestQuarter {
  const share = points / Math.max(MIN_CHEST_POINTS, jackpot)
  return Math.min(4, Math.max(1, Math.ceil(share * 4 - 1e-9))) as ChestQuarter
}

/** Today's opening, or null while today's chest is still shut. */
export function chestOpened(entries: readonly RewardEntry[], now: Date = new Date()): RewardEntry | null {
  const today = toLocalDay(now)
  return entries.find((entry) => entry.taskId === CHEST_ID && entry.day === today) ?? null
}

/**
 * Why the chest has nothing to give just now, or null while a key is waiting.
 *
 * Opened is answered **first**, so a day that came clear, was opened and then
 * came undone again still reads as opened rather than as unclear: the chest was
 * opened, and that is the whole of it. What it gave is never taken back either,
 * unlike a period bonus (RWD-26) — there is no undoing a thing whose point was
 * the moment it happened.
 *
 * A clear day has everything it asked for done, so asking for at least so many
 * tasks is asking for at least so many done; and a day with nothing in it is
 * never clear (`isPeriodCleared`), so an empty day earns nothing.
 */
export function chestBlock(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: ChestSettings,
  now: Date = new Date(),
): ChestBlock | null {
  if (chestOpened(entries, now) !== null) return 'opened'

  const { total, remaining } = summarize(tasks, 'today', now)
  if (total === 0 || remaining > 0) return 'unclear'
  if (total < settings.leastTasks) return 'tooSmall'

  return null
}

/** Whether a key is waiting, which is what the page and the notice ask. */
export function hasKey(
  tasks: readonly Task[],
  entries: readonly RewardEntry[],
  settings: ChestSettings,
  now: Date = new Date(),
): boolean {
  return chestBlock(tasks, entries, settings, now) === null
}
