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
 * Both are **records of their own** — a name, a price and which kind they are —
 * rather than anything a task or a redemption knows about. Redeeming one spends
 * its points on its name (./redemption), and what was spent stays as it was
 * written: repricing one, renaming it or deleting it never rewrites the
 * redemptions it has already been through, just as changing a task's reward
 * never reprices its completions (RWD-3).
 *
 * A price is set in points or **in money** (RWD-47). One in money is what the
 * thing costs in a shop, and what it costs in points follows from what a point
 * is worth **as it stands** (./pointValue): a phone priced at 30 000 UAH still
 * costs 30 000 UAH when a point comes to be worth more, and fewer points buy it.
 */

import {
  isCurrency,
  isSameCurrency,
  isToThePenny,
  MAX_CURRENCY_LENGTH,
  moneyFor,
  pointsForMoney,
  type Money,
  type PointValue,
} from './pointValue'

export type PrizeId = string

/** What one costs, as it was set: a number of points, or an amount of money (RWD-47). */
export type PrizePrice =
  | { readonly in: 'points'; readonly points: number }
  | ({ readonly in: 'money' } & Money)

/** What a price is typed in: points, or a currency (RWD-47). */
export type PriceUnit = { readonly in: 'points' } | { readonly in: 'money'; readonly currency: string }

/** Which of the two a record is: one that comes round again, or the one big thing. */
export type PrizeKind = 'prize' | 'wish'

export const PRIZE_KINDS: readonly PrizeKind[] = ['prize', 'wish']

export interface Prize {
  readonly id: PrizeId
  /** What it is, as it was written: `A square of chocolate`, `A new phone`. */
  readonly name: string
  /** What it costs, in points or in money, as it was set. */
  readonly price: PrizePrice
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

/** The most money one can be priced at. Room for a flat, in any currency. */
export const MAX_PRIZE_MONEY = 1_000_000_000

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

/** Whether one can be priced at this much money: more than nothing, to the penny, not absurd. */
export function isPrizeMoney(amount: number): boolean {
  return amount > 0 && amount <= MAX_PRIZE_MONEY && isToThePenny(amount)
}

/** Whether this is a price: points that a prize can cost, or money in a currency. */
export function isPrizePrice(price: PrizePrice): boolean {
  return price.in === 'points' ? isPrizePoints(price.points) : isPrizeMoney(price.amount) && isCurrency(price.currency)
}

/**
 * This much in this unit as a price, or null where it is not one: points that
 * are not a whole number from 1, money that is nothing or finer than a penny.
 * Money is kept to the penny and its currency trimmed.
 */
export function priceOf(amount: number, unit: PriceUnit): PrizePrice | null {
  const price: PrizePrice =
    unit.in === 'points' ? { in: 'points', points: amount } : { in: 'money', amount, currency: unit.currency.trim() }
  if (!isPrizePrice(price)) return null
  // To the penny already; rounded only to leave no floating point dust.
  return price.in === 'money' ? { ...price, amount: Math.round(price.amount * 100) / 100 } : price
}

/** A price of this many points. */
export function priceInPoints(points: number): PrizePrice {
  return checkedPrice({ in: 'points', points })
}

/** A price of this much money (RWD-47). */
export function priceInMoney(amount: number, currency: string): PrizePrice {
  return checkedPrice({ in: 'money', amount, currency })
}

function checkedPrice(price: PrizePrice): PrizePrice {
  const checked = priceOf(price.in === 'points' ? price.points : price.amount, price)
  if (checked === null) {
    throw new InvalidPrizeError(
      price.in === 'points'
        ? `${String(price.points)} is not a price: a prize costs a whole number of points from ${String(MIN_PRIZE_POINTS)} to ${String(MAX_PRIZE_POINTS)}.`
        : `${String(price.amount)} ${price.currency} is not a price: money is more than nothing, at most ${String(MAX_PRIZE_MONEY)}, to the penny, in a currency of at most ${String(MAX_CURRENCY_LENGTH)} characters.`,
    )
  }

  return checked
}

function isSamePrice(a: PrizePrice, b: PrizePrice): boolean {
  if (a.in === 'points') return b.in === 'points' && a.points === b.points
  return b.in === 'money' && a.amount === b.amount && a.currency === b.currency
}

/** A prize or a wish of the given name at the given price, still to be bought. */
export function createPrize(
  name: string,
  price: PrizePrice,
  kind: PrizeKind = 'prize',
  now: Date = new Date(),
): Prize {
  return {
    id: crypto.randomUUID(),
    name: normalizePrizeName(name),
    price: checkedPrice(price),
    kind,
    boughtAt: null,
    createdAt: now.toISOString(),
  }
}

/**
 * What one costs in points as things stand (RWD-47): its price, where it was
 * priced in points; where in money, the fewest points worth that much at the
 * rate. Null for one priced in money while no rate is set in its currency — it
 * cannot be bought until one is.
 */
export function pricePoints(prize: Prize, value: PointValue | null): number | null {
  const { price } = prize
  return price.in === 'points' ? price.points : pointsForMoney(price.amount, price.currency, value)
}

/**
 * What one costs in money, or null where that cannot be said: the money it was
 * priced at, as it was set, or what its points come to at the rate (RWD-32).
 */
export function priceMoney(prize: Prize, value: PointValue | null): Money | null {
  const { price } = prize
  if (price.in === 'money') return { amount: price.amount, currency: price.currency }
  const amount = moneyFor(price.points, value)
  return amount === null || value === null ? null : { amount, currency: value.currency }
}

/**
 * What one's price is typed in (RWD-47). A **wish** is priced in the rate's
 * currency wherever a point has a value, since the big things are priced in
 * shops; a **prize** is small enough to count in points. One already priced in
 * money with no rate to say it in another is changed in its own currency, and
 * anything else in points. `price` is the one being changed, or null for a new one.
 */
export function priceUnit(kind: PrizeKind, value: PointValue | null, price: PrizePrice | null = null): PriceUnit {
  if (kind === 'wish' && value !== null) return { in: 'money', currency: value.currency }
  if (price?.in === 'money') return { in: 'money', currency: price.currency }
  return { in: 'points' }
}

/**
 * A price said in this unit, as the box that changes it starts out: points as
 * they are, money at the rate either way. Null where it cannot be said in it —
 * money in a currency the rate is not in — and the box then starts empty rather
 * than with a number that would mean something else.
 */
export function priceIn(price: PrizePrice, unit: PriceUnit, value: PointValue | null): number | null {
  if (unit.in === 'points') {
    return price.in === 'points' ? price.points : pointsForMoney(price.amount, price.currency, value)
  }
  if (price.in === 'money') return isSameCurrency(price.currency, unit.currency) ? price.amount : null
  return value === null || !isSameCurrency(value.currency, unit.currency) ? null : moneyFor(price.points, value)
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

/** Changes what a prize costs, in points or in money. Only redemptions from here on pay the new price. */
export function repricePrize(prize: Prize, price: PrizePrice): Prize {
  const priced = checkedPrice(price)
  return isSamePrice(priced, prize.price) ? prize : { ...prize, price: priced }
}

/** Whether any prize is called this already, whatever its case — `except` aside, which is its own. */
export function isPrizeNameTaken(prizes: readonly Prize[], name: string, except: PrizeId | null = null): boolean {
  const trimmed = name.trim().replace(/\s+/gu, ' ').toLowerCase()
  return prizes.some((prize) => prize.id !== except && prize.name.toLowerCase() === trimmed)
}

/** Just the prizes, or just the wishes (RWD-40), in the order they are shown at the rate. */
export function prizesOfKind(prizes: readonly Prize[], kind: PrizeKind, value: PointValue | null): Prize[] {
  return sortPrizes(
    prizes.filter((prize) => prize.kind === kind),
    value,
  )
}

/**
 * The prizes in the order they are shown: what can still be bought first, then
 * **cheapest first** in points at the rate, so the next one within reach heads
 * the list, then by name and by id, so two merged devices never leave it to
 * chance. One priced in money that the rate cannot count follows those that
 * can, cheapest first in its own money (RWD-47). A wish already bought sits at
 * the end, where it is a record of what the points went on rather than
 * something to work towards. Returns a new array.
 */
export function sortPrizes(prizes: readonly Prize[], value: PointValue | null): Prize[] {
  return [...prizes].sort((a, b) => {
    if (isAvailable(a) !== isAvailable(b)) return isAvailable(a) ? -1 : 1
    const aPoints = pricePoints(a, value)
    const bPoints = pricePoints(b, value)
    if (aPoints !== bPoints) {
      if (aPoints === null) return 1
      if (bPoints === null) return -1
      return aPoints - bPoints
    }
    // Neither can be counted in points, so both are priced in money.
    if (a.price.in === 'money' && b.price.in === 'money' && aPoints === null && a.price.amount !== b.price.amount) {
      return a.price.amount - b.price.amount
    }
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
 * Whether the balance covers the prize at the rate and it is still there to
 * buy. Nothing is spent that has not been earned (RWD-16), a wish is bought
 * once (RWD-40), and one whose price the rate cannot count is not bought until
 * it can (RWD-47).
 */
export function canAfford(prize: Prize, balance: number, value: PointValue | null): boolean {
  const points = pricePoints(prize, value)
  return isAvailable(prize) && points !== null && balance >= points
}

/** The prizes the balance reaches, cheapest first: what could be redeemed right now. */
export function affordablePrizes(prizes: readonly Prize[], balance: number, value: PointValue | null): Prize[] {
  return sortPrizes(prizes, value).filter((prize) => canAfford(prize, balance, value))
}

/**
 * The cheapest one the balance does not reach yet — what saving up is for — or
 * null once it reaches every one of them, or there are none. What has been
 * bought already is behind us, and is never what is being saved up for; nor is
 * one the rate cannot count, there being no telling how far off it is.
 */
export function nextPrize(prizes: readonly Prize[], balance: number, value: PointValue | null): Prize | null {
  return (
    sortPrizes(prizes, value).find(
      (prize) => isAvailable(prize) && pricePoints(prize, value) !== null && !canAfford(prize, balance, value),
    ) ?? null
  )
}

/**
 * How many points short of the prize the balance is at the rate, 0 once it
 * covers it, or null where the rate cannot count its price (RWD-47).
 */
export function pointsShort(prize: Prize, balance: number, value: PointValue | null): number | null {
  const points = pricePoints(prize, value)
  return points === null ? null : Math.max(0, points - balance)
}
