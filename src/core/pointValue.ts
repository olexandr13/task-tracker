/**
 * What a point is worth: the rate points are counted in money at.
 *
 * One rate for the whole account — `1 point is 1 UAH` — kept beside the ledger
 * rather than on anything that earned or was spent. It changes nothing about
 * the points themselves: a balance is a number of points, and this only says
 * what that number comes to in money, wherever the app spells it out.
 *
 * It is the rate as it stands, never the rate a completion earned at: what an
 * old day was worth in money is not a question the app answers, and nothing
 * saved would be rewritten if it were.
 */

/** An amount of money and what it is in: `30 000 UAH`. */
export interface Money {
  /** More than nothing, to two decimal places. */
  readonly amount: number
  /** What the money is: `UAH`, `€`. Whatever it is written as. */
  readonly currency: string
}

/** What one point is worth. */
export interface PointValue {
  /** Money for one point, more than nothing, to two decimal places. */
  readonly amount: number
  /** What that money is: `UAH`, `€`, `hours`. Whatever it is written as. */
  readonly currency: string
}

/** What the currency is called until it is changed. */
export const DEFAULT_CURRENCY = 'UAH'

/** What one point is worth until it is changed: a point is a unit of money. */
export const DEFAULT_POINT_AMOUNT = 1

/** As long a currency as there is room for beside an amount. */
export const MAX_CURRENCY_LENGTH = 8

/** The most one point can be worth. */
export const MAX_POINT_AMOUNT = 1_000_000

export class InvalidPointValueError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPointValueError'
  }
}

/** Whether an amount of money is no finer than a penny: two decimal places at most. */
export function isToThePenny(amount: number): boolean {
  // Asked in a way that floating point can answer: 0.07 × 100 is not exactly 7.
  return Number.isFinite(amount) && Math.abs(Math.round(amount * 100) - amount * 100) < 1e-9
}

/** Whether one point can be worth this: more than nothing, not absurd, and no finer than a penny. */
export function isPointAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= MAX_POINT_AMOUNT && isToThePenny(amount)
}

/** Whether `currency` can name what the amount is in: something other than space, on one line, short. */
export function isCurrency(currency: string): boolean {
  const trimmed = currency.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_CURRENCY_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** Whether two currencies are the same one, whatever the case they are written in: `uah` is `UAH`. */
export function isSameCurrency(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** What one point is worth, as it is saved: the amount to the penny, the currency trimmed. */
export function createPointValue(amount: number, currency: string = DEFAULT_CURRENCY): PointValue {
  if (!isPointAmount(amount)) {
    throw new InvalidPointValueError(
      `${String(amount)} is not what a point is worth: more than nothing, at most ${String(MAX_POINT_AMOUNT)}, to two decimal places.`,
    )
  }
  if (!isCurrency(currency)) {
    throw new InvalidPointValueError(
      `"${currency}" is not a currency: something other than space, on one line, of at most ${String(MAX_CURRENCY_LENGTH)} characters.`,
    )
  }

  return { amount: Math.round(amount * 100) / 100, currency: currency.trim() }
}

/**
 * What this many points come to in money, to the penny, or null while nothing
 * says what a point is worth. Points below zero (RWD-17) come to money below
 * zero: it is the same number seen another way.
 */
export function moneyFor(points: number, value: PointValue | null): number | null {
  return value === null ? null : Math.round(points * value.amount * 100) / 100
}

/**
 * How many points this much money comes to at the rate (RWD-47): the fewest
 * whole points worth at least that much, so what is priced in money is never
 * had for less than it costs. Null while nothing says what a point is worth, or
 * while the money is in a currency the rate is not.
 */
export function pointsForMoney(amount: number, currency: string, value: PointValue | null): number | null {
  if (value === null || !isSameCurrency(currency, value.currency)) return null
  // Counted in pennies, which are whole, so a division that comes out even is exact.
  return Math.ceil(Math.round(amount * 100) / Math.round(value.amount * 100))
}
