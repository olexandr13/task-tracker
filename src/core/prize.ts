/**
 * What the points are spent on, in two kinds.
 *
 * A **prize** is small and comes round again: a square of chocolate, five
 * minutes of something, a coffee. Redeeming one spends its points and leaves it
 * exactly where it was, to be redeemed again tomorrow.
 *
 * A **wish** is the big one being saved up for: a phone, a bicycle, a trip.
 * There is one of it, so buying it **takes it off the list of what can be
 * bought** — it stays listed as bought, and the redemption stays in the history
 * whatever becomes of the record afterwards.
 *
 * Both are **records of their own** — a name, a price in points and which kind
 * they are — rather than anything a task or a redemption knows about. Redeeming
 * one spends its points on its name (./redemption), and what was spent stays as
 * it was written: repricing one, renaming it or deleting it never rewrites the
 * redemptions it has already been through, just as changing a task's reward
 * never reprices its completions (RWD-3).
 */

export type PrizeId = string

/** Which of the two a record is: one that comes round again, or the one big thing. */
export type PrizeKind = 'prize' | 'wish'

export const PRIZE_KINDS: readonly PrizeKind[] = ['prize', 'wish']

export interface Prize {
  readonly id: PrizeId
  /** What it is, as it was written: `A square of chocolate`, `A new phone`. */
  readonly name: string
  /** What it costs: a whole number of points, from 1. */
  readonly points: number
  /** Which kind it is: a prize comes round again, a wish is bought once. */
  readonly kind: PrizeKind
  /**
   * When a wish was bought, as an ISO 8601 timestamp, or null while it is still
   * to come. A prize is never bought: it comes round again, so it is always null.
   */
  readonly boughtAt: string | null
  /** ISO 8601 timestamp. */
  readonly createdAt: string
}

/** As long a name as a prize is given room for on screen. */
export const MAX_PRIZE_NAME_LENGTH = 60

/** The least a prize can cost. Nothing is free: a prize is something points buy. */
export const MIN_PRIZE_POINTS = 1

/** The most a prize can cost. Room for the big one being saved up for. */
export const MAX_PRIZE_POINTS = 1_000_000

export class InvalidPrizeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPrizeError'
  }
}

/** Whether `name` can name a prize: something other than space, on one line, short enough to read. */
export function isPrizeName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_PRIZE_NAME_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** The stored form of a prize's name: trimmed, with the spaces inside it squeezed to one. */
export function normalizePrizeName(name: string): string {
  const trimmed = name.trim().replace(/\s+/gu, ' ')
  if (!isPrizeName(trimmed)) {
    throw new InvalidPrizeError(
      `"${name}" is not a prize name: a prize needs a name, on one line, of at most ${String(MAX_PRIZE_NAME_LENGTH)} characters.`,
    )
  }

  return trimmed
}

/** Whether a prize can cost this: a whole number of points inside the range. */
export function isPrizePoints(points: number): boolean {
  return Number.isInteger(points) && points >= MIN_PRIZE_POINTS && points <= MAX_PRIZE_POINTS
}

function checkedPoints(points: number): number {
  if (!isPrizePoints(points)) {
    throw new InvalidPrizeError(
      `${String(points)} is not a price: a prize costs a whole number of points from ${String(MIN_PRIZE_POINTS)} to ${String(MAX_PRIZE_POINTS)}.`,
    )
  }

  return points
}

/** A prize or a wish of the given name at the given price, still to be bought. */
export function createPrize(
  name: string,
  points: number,
  kind: PrizeKind = 'prize',
  now: Date = new Date(),
): Prize {
  return {
    id: crypto.randomUUID(),
    name: normalizePrizeName(name),
    points: checkedPoints(points),
    kind,
    boughtAt: null,
    createdAt: now.toISOString(),
  }
}

/**
 * Whether this is something the points can still buy: a prize always is, and a
 * wish is until it has been bought (RWD-40).
 */
export function isAvailable(prize: Prize): boolean {
  return prize.kind === 'prize' || prize.boughtAt === null
}

/**
 * Marks a wish bought, which takes it off what the points can buy. A prize is
 * handed back untouched: redeeming one leaves it to come round again.
 *
 * Returns a new prize; the one passed in is never modified.
 */
export function markBought(prize: Prize, now: Date = new Date()): Prize {
  if (prize.kind !== 'wish' || prize.boughtAt !== null) return prize
  return { ...prize, boughtAt: now.toISOString() }
}

/** Puts a bought wish back among what the points can buy — undoing the redemption that bought it. */
export function putBack(prize: Prize): Prize {
  return prize.boughtAt === null ? prize : { ...prize, boughtAt: null }
}

/**
 * Renames a prize. What it has already been redeemed for keeps the name it was
 * redeemed under: what was spent is not rewritten (RWD-17).
 *
 * Returns a new prize; the one passed in is never modified.
 */
export function renamePrize(prize: Prize, name: string): Prize {
  const renamed = normalizePrizeName(name)
  return renamed === prize.name ? prize : { ...prize, name: renamed }
}

/** Changes what a prize costs. Only redemptions from here on pay the new price. */
export function repricePrize(prize: Prize, points: number): Prize {
  const priced = checkedPoints(points)
  return priced === prize.points ? prize : { ...prize, points: priced }
}

/** Whether any prize is called this already, whatever its case — `except` aside, which is its own. */
export function isPrizeNameTaken(prizes: readonly Prize[], name: string, except: PrizeId | null = null): boolean {
  const trimmed = name.trim().replace(/\s+/gu, ' ').toLowerCase()
  return prizes.some((prize) => prize.id !== except && prize.name.toLowerCase() === trimmed)
}

/** Just the prizes, or just the wishes (RWD-40). */
export function prizesOfKind(prizes: readonly Prize[], kind: PrizeKind): Prize[] {
  return sortPrizes(prizes.filter((prize) => prize.kind === kind))
}

/**
 * The prizes in the order they are shown: what can still be bought first, then
 * **cheapest first**, so the next one within reach heads the list, then by name
 * and by id, so two merged devices never leave it to chance. A wish already
 * bought sits at the end, where it is a record of what the points went on
 * rather than something to work towards. Returns a new array.
 */
export function sortPrizes(prizes: readonly Prize[]): Prize[] {
  return [...prizes].sort((a, b) => {
    if (isAvailable(a) !== isAvailable(b)) return isAvailable(a) ? -1 : 1
    if (a.points !== b.points) return a.points - b.points
    const byName = a.name.localeCompare(b.name)
    if (byName !== 0) return byName
    if (a.id === b.id) return 0
    return a.id < b.id ? -1 : 1
  })
}

export function findPrize(prizes: readonly Prize[], id: PrizeId): Prize | null {
  return prizes.find((prize) => prize.id === id) ?? null
}

/**
 * Whether the balance covers the prize and it is still there to buy. Nothing is
 * spent that has not been earned (RWD-16), and a wish is bought once (RWD-40).
 */
export function canAfford(prize: Prize, balance: number): boolean {
  return isAvailable(prize) && balance >= prize.points
}

/** The prizes the balance reaches, cheapest first: what could be redeemed right now. */
export function affordablePrizes(prizes: readonly Prize[], balance: number): Prize[] {
  return sortPrizes(prizes).filter((prize) => canAfford(prize, balance))
}

/**
 * The cheapest one the balance does not reach yet — what saving up is for — or
 * null once it reaches every one of them, or there are none. What has been
 * bought already is behind us, and is never what is being saved up for.
 */
export function nextPrize(prizes: readonly Prize[], balance: number): Prize | null {
  return sortPrizes(prizes).find((prize) => isAvailable(prize) && !canAfford(prize, balance)) ?? null
}

/** How many points short of the prize the balance is, or 0 once it covers it. */
export function pointsShort(prize: Prize, balance: number): number {
  return Math.max(0, prize.points - balance)
}
