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

/** Whether one point can be worth this: more than nothing, not absurd, and no finer than a penny. */
export function isPointAmount(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_POINT_AMOUNT) return false
  // Two decimal places at most, asked in a way that floating point can answer:
  // 0.07 × 100 is not exactly 7.
  return Math.abs(Math.round(amount * 100) - amount * 100) < 1e-9
}

/** Whether `currency` can name what the amount is in: something other than space, on one line, short. */
export function isCurrency(currency: string): boolean {
  const trimmed = currency.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_CURRENCY_LENGTH && !/[\r\n]/u.test(trimmed)
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
