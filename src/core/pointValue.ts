/**
 * What a point is worth: the rate points are counted in money at.
 *
 * One rate for the whole account — `1 point is 1 UAH` — kept beside the ledger
 * rather than on anything that earned or was spent. It changes nothing about
 * the points themselves: a balance is a number of points, and this says what
 * that number comes to in money, wherever the app spells it out, and how many
 * points a price set in money costs (RWD-47).
 *
 * Beside that **main currency** there can be **others** (RWD-49), each with
 * what one of it is worth in the main one — `1 USD = 41.50 UAH` — so a coffee
 * can be priced in hryvnias and a laptop in dollars, and both still cost points.
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

/** What one of another currency is worth in the main one: `1 USD = 41.50 UAH` (RWD-49). */
export interface CurrencyRate {
  /** The other currency: `USD`. */
  readonly currency: string
  /** What one of it comes to in the main currency: more than nothing, to four decimal places. */
  readonly amount: number
}

/** What one point is worth. */
export interface PointValue {
  /** Money for one point, more than nothing, to two decimal places. */
  readonly amount: number
  /** What that money is — the main currency: `UAH`, `€`, `hours`. Whatever it is written as. */
  readonly currency: string
  /** The other currencies prices can be set in, in the order they were added (RWD-49). None to begin with. */
  readonly otherCurrencies: readonly CurrencyRate[]
}

/** What the currency is called until it is changed. */
export const DEFAULT_CURRENCY = 'UAH'

/** What one point is worth until it is changed: a point is a unit of money. */
export const DEFAULT_POINT_AMOUNT = 1

/** As long a currency as there is room for beside an amount. */
export const MAX_CURRENCY_LENGTH = 8

/** The most one point can be worth. */
export const MAX_POINT_AMOUNT = 1_000_000

/** The most one of another currency can be worth in the main one. */
export const MAX_CURRENCY_RATE = 1_000_000

/**
 * How many currencies there can be besides the main one: enough for the few a
 * person shops in, few enough that choosing one beside a price is a glance.
 */
export const MAX_OTHER_CURRENCIES = 4

export class InvalidPointValueError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPointValueError'
  }
}

/** Whether an amount has no more than this many decimal places. */
function hasPlaces(amount: number, places: number): boolean {
  const scaled = amount * 10 ** places
  // Asked in a way that floating point can answer: 0.07 × 100 is not exactly 7.
  return Number.isFinite(amount) && Math.abs(Math.round(scaled) - scaled) < 1e-6
}

/** Whether an amount of money is no finer than a penny: two decimal places at most. */
export function isToThePenny(amount: number): boolean {
  return hasPlaces(amount, 2)
}

/** Whether one point can be worth this: more than nothing, not absurd, and no finer than a penny. */
export function isPointAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= MAX_POINT_AMOUNT && isToThePenny(amount)
}

/**
 * Whether one of another currency can be worth this in the main one: more than
 * nothing, to four decimal places, so a weaker currency can be said in a
 * stronger one — `1 UAH = 0.0241 USD` (RWD-49).
 */
export function isCurrencyRate(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= MAX_CURRENCY_RATE && hasPlaces(amount, 4)
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

/**
 * What one point is worth, as it is saved: the amount to the penny, each
 * currency trimmed and each rate to four places. No currency can be there
 * twice, whatever its case, nor more than `MAX_OTHER_CURRENCIES` besides the
 * main one.
 */
export function createPointValue(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  otherCurrencies: readonly CurrencyRate[] = [],
): PointValue {
  if (!isPointAmount(amount)) {
    throw new InvalidPointValueError(
      `${String(amount)} is not what a point is worth: more than nothing, at most ${String(MAX_POINT_AMOUNT)}, to two decimal places.`,
    )
  }
  for (const each of [currency, ...otherCurrencies.map((other) => other.currency)]) {
    if (!isCurrency(each)) {
      throw new InvalidPointValueError(
        `"${each}" is not a currency: something other than space, on one line, of at most ${String(MAX_CURRENCY_LENGTH)} characters.`,
      )
    }
  }
  for (const other of otherCurrencies) {
    if (!isCurrencyRate(other.amount)) {
      throw new InvalidPointValueError(
        `${String(other.amount)} is not what one ${other.currency} is worth: more than nothing, at most ${String(MAX_CURRENCY_RATE)}, to four decimal places.`,
      )
    }
  }
  const all = [currency, ...otherCurrencies.map((other) => other.currency)]
  if (all.some((each, index) => all.findIndex((other) => isSameCurrency(other, each)) !== index)) {
    throw new InvalidPointValueError(`${all.join(', ')} names a currency twice.`)
  }
  if (otherCurrencies.length > MAX_OTHER_CURRENCIES) {
    throw new InvalidPointValueError(`There can be at most ${String(MAX_OTHER_CURRENCIES)} other currencies.`)
  }

  return {
    amount: Math.round(amount * 100) / 100,
    currency: currency.trim(),
    otherCurrencies: otherCurrencies.map((other) => ({
      currency: other.currency.trim(),
      amount: Math.round(other.amount * 10_000) / 10_000,
    })),
  }
}

/**
 * The point value with these other currencies instead, or null where they will
 * not do — a currency twice, the main one among them, a rate that is no rate.
 * For saving as it is typed, where half a rate is not saved.
 */
export function withOtherCurrencies(value: PointValue, otherCurrencies: readonly CurrencyRate[]): PointValue | null {
  try {
    return createPointValue(value.amount, value.currency, otherCurrencies)
  } catch (error) {
    if (error instanceof InvalidPointValueError) return null
    throw error
  }
}

/** Every currency a price can be set in: the main one first, then the others as they were added (RWD-49). */
export function currenciesOf(value: PointValue | null): string[] {
  return value === null ? [] : [value.currency, ...value.otherCurrencies.map((other) => other.currency)]
}

/**
 * The rate's own spelling of a currency it knows, whatever case it was asked
 * in, or null where it knows no such currency.
 */
export function knownCurrency(value: PointValue | null, currency: string): string | null {
  return currenciesOf(value).find((each) => isSameCurrency(each, currency)) ?? null
}

/**
 * What this many points come to in the main currency, to the penny, or null
 * while nothing says what a point is worth. Points below zero (RWD-17) come to
 * money below zero: it is the same number seen another way.
 */
export function moneyFor(points: number, value: PointValue | null): number | null {
  return value === null ? null : Math.round(points * value.amount * 100) / 100
}

/**
 * How many points this much money comes to at the rate (RWD-47): the fewest
 * whole points worth at least that much, so what is priced in money is never
 * had for less than it costs. Money in another currency is first said in the
 * main one at its own rate (RWD-49). Null while nothing says what a point is
 * worth, or while the money is in a currency the rate does not know.
 */
export function pointsForMoney(amount: number, currency: string, value: PointValue | null): number | null {
  if (value === null) return null
  const rate = isSameCurrency(currency, value.currency)
    ? 1
    : value.otherCurrencies.find((other) => isSameCurrency(other.currency, currency))?.amount
  if (rate === undefined) return null

  // Counted in whole pennies and ten-thousandths, so the division is exact; the
  // product can pass what a double holds whole, so it is a BigInt.
  const money = BigInt(Math.round(amount * 100)) * BigInt(Math.round(rate * 10_000))
  const point = BigInt(Math.round(value.amount * 100)) * 10_000n
  return Number((money + point - 1n) / point)
}
