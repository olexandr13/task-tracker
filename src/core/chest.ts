/**
 * The chest: what a cleared day is worth when the amount is a surprise (CHST-1).
 *
 * A task's reward pays a known amount for a known piece of work, and a period
 * bonus (./bonus) pays a known amount for clearing a stretch of it. This pays an
 * **unknown** amount for clearing today — a share of a **jackpot** drawn from a
 * table, so that finishing the day is worth coming back to rather than worth a
 * number already known before the day began.
 *
 * Clearing Today earns one **key**, and the key opens one chest. Like a bonus,
 * what a chest gives rides in the same ledger as every completion (./reward),
 * under an id of its own — so it counts towards the balance and the period
 * tiles, shows among the earnings, and stays earned whatever becomes of the
 * tasks that earned it. The ledger names an entry by its task and its day, so
 * that id and the day are together the record of the chest being opened: one a
 * day, counted once however many devices saw it.
 *
 * Nothing here is stored but the two settings. Whether a key is waiting is
 * derived from the tasks as they stand and the ledger as it stands, the same
 * question the progress bars already answer (./progress).
 */

import { isBonus } from './bonus'
import { offsetDay, toLocalDay, type LocalDay } from './day'
import { summarize } from './progress'
import type { RewardEntry } from './reward'
import type { Task, TaskId } from './task'

/**
 * How rich an opening turned out. The colour of the light leaking from the lid
 * is this, and so is the glow of the open chest; a chest holds no symbol to read
 * it off, so the tier is the whole of what the opening says besides the number.
 */
export type ChestTier = 'pinch' | 'handful' | 'haul' | 'jackpot'

/** The tiers, poorest first. */
export const CHEST_TIERS: readonly ChestTier[] = ['pinch', 'handful', 'haul', 'jackpot']

/** One line of what a chest can hold: how often it comes up, and what it pays. */
export interface ChestPrize {
  readonly tier: ChestTier
  /** How often this tier comes up, against the weights of the rest. */
  readonly weight: number
  /** The least of the jackpot it pays, as a share of it from 0 to 1. */
  readonly low: number
  /** The most. Equal to `low` where the tier pays one fixed share. */
  readonly high: number
}

/**
 * What a chest can hold (CHST-10). The weights read as percentages, summing to 100, which
 * is the point of writing them this way: the whole game is meant to be read off
 * this table and argued with.
 *
 * A chest is **never empty** (CHST-11). The poorest opening is a pinch, not nothing: an
 * app that fights procrastination must not answer a cleared day with nothing,
 * however good a gamble that would make it.
 */
export const CHEST_PRIZES: readonly ChestPrize[] = [
  { tier: 'pinch', weight: 50, low: 0.04, high: 0.12 },
  { tier: 'handful', weight: 31, low: 0.15, high: 0.35 },
  { tier: 'haul', weight: 15, low: 0.4, high: 0.75 },
  { tier: 'jackpot', weight: 4, low: 1, high: 1 },
]

/** What one opening gave. */
export interface ChestOpen {
  readonly tier: ChestTier
  /** What it paid: a whole number of points, never less than 1. */
  readonly points: number
  /** What it was playing for, as it stood when the chest was opened. */
  readonly jackpot: number
}

/**
 * The least a chest can pay, however small the jackpot (CHST-11) — and so also
 * the least the jackpot itself can be (CHST-9): a chest that could give 1 point
 * at best and 0 at worst would be a chest that could be empty.
 */
export const MIN_CHEST_POINTS = 1

/** The most, which is what a single task can be worth at most (MAX_REWARD). */
export const CHEST_MAX_JACKPOT = 999

/**
 * What an opening is recorded under in place of a task, as a bonus is
 * (`BONUS_IDS`). Tasks are named by `crypto.randomUUID()`, so this is no task's
 * id and never will be.
 */
export const CHEST_ID: TaskId = 'chest-open'

/** Which day's work the jackpot is read from. */
export type ChestJackpot = 'bestTask' | 'typicalDay'

/** The ways the jackpot can be worked out, in the order they are offered. */
export const CHEST_JACKPOTS: readonly ChestJackpot[] = ['bestTask', 'typicalDay']

/** What a day has to be before it earns a key, and what the key plays for. */
export interface ChestSettings {
  /**
   * How many tasks the day has to have asked for. A day with fewer earns no key
   * however clear it is, so a single thing remembered at nine in the evening is
   * not a day's work.
   */
  readonly leastTasks: number
  readonly jackpot: ChestJackpot
}

export const MIN_LEAST_TASKS = 1
export const MAX_LEAST_TASKS = 99

/**
 * What an account starts with: any cleared day earns a key, and the key plays
 * for what the day's heaviest task was worth.
 */
export const DEFAULT_CHEST: ChestSettings = { leastTasks: MIN_LEAST_TASKS, jackpot: 'bestTask' }

/** Whether a day can be asked for this many tasks before it earns a key. */
export function isLeastTasks(tasks: number): boolean {
  return Number.isInteger(tasks) && tasks >= MIN_LEAST_TASKS && tasks <= MAX_LEAST_TASKS
}

/** Why there is no key to be had just now, or null while one is waiting. */
export type ChestBlock = 'opened' | 'unclear' | 'tooSmall'

/**
 * Draws a tier by weight, then an amount inside that tier's band, and works out
 * what that is worth of this jackpot.
 *
 * Two numbers are taken from `random` every time, whichever tier comes up — the
 * second does nothing for a tier that pays one fixed share — so that how many
 * are drawn never depends on what was drawn, and a test can hand over a pair and
 * know what it will get.
 */
export function openChest(jackpot: number, random: () => number = Math.random): ChestOpen {
  const prize = drawPrize(random())
  const share = prize.low + random() * (prize.high - prize.low)

  return { tier: prize.tier, points: chestPoints(share, jackpot), jackpot }
}

/** What a share of the jackpot comes to: whole points, never 0, never over it. */
export function chestPoints(share: number, jackpot: number): number {
  return Math.min(Math.max(MIN_CHEST_POINTS, Math.round(share * jackpot)), Math.max(MIN_CHEST_POINTS, jackpot))
}

/**
 * The most a chest can give, as the ledger stands (CHST-7): by default exactly
 * what the most valuable task finished today was worth. Never less than the
 * least a chest gives (`MIN_CHEST_POINTS`), so a day whose tasks earned nothing
 * yet plays for 1 rather than for nothing.
 *
 * Both ways of working it out read **what tasks earned** and nothing else: a bonus and an earlier chest are what
 * the app paid on top of the work rather than the work itself, and counting a
 * chest would feed a big opening into the next jackpot and spiral.
 */
export function chestJackpot(
  entries: readonly RewardEntry[],
  settings: ChestSettings,
  now: Date = new Date(),
): number {
  const today = toLocalDay(now)
  const worked = entries.filter((entry) => isTaskEarning(entry))

  const raw =
    settings.jackpot === 'bestTask'
      ? worked.reduce((best, entry) => (entry.day === today ? Math.max(best, entry.points) : best), 0)
      : Math.round(sinceLastWeek(worked, today) / TYPICAL_DAYS)

  return Math.min(Math.max(MIN_CHEST_POINTS, raw), CHEST_MAX_JACKPOT)
}

/** How many days "a typical day" averages over: today and the six before it. */
export const TYPICAL_DAYS = 7

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

/** Whether the entry is a task's own earning rather than the app's own paying. */
function isTaskEarning(entry: RewardEntry): boolean {
  return entry.taskId !== CHEST_ID && !isBonus(entry.taskId)
}

function sinceLastWeek(entries: readonly RewardEntry[], today: LocalDay): number {
  const from = offsetDay(today, -(TYPICAL_DAYS - 1))
  return entries.reduce((sum, entry) => (entry.day >= from && entry.day <= today ? sum + entry.points : sum), 0)
}

function totalWeight(): number {
  return CHEST_PRIZES.reduce((sum, prize) => sum + prize.weight, 0)
}

/** The tier a roll of 0 to 1 lands on, walking the weights in order. */
function drawPrize(roll: number): ChestPrize {
  let left = roll * totalWeight()

  for (const prize of CHEST_PRIZES) {
    left -= prize.weight
    if (left < 0) return prize
  }

  // Only a roll of exactly 1 reaches here, which `Math.random` never returns.
  return CHEST_PRIZES[CHEST_PRIZES.length - 1]
}
