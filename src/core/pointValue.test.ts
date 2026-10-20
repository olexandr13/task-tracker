import { describe, expect, it } from 'vitest'
import {
  createPointValue,
  DEFAULT_CURRENCY,
  InvalidPointValueError,
  isCurrency,
  isPointAmount,
  isCurrencyRate,
  isSameCurrency,
  currenciesOf,
  knownCurrency,
  MAX_OTHER_CURRENCIES,
  MAX_POINT_AMOUNT,
  moneyFor,
  pointsForMoney,
  withOtherCurrencies,
} from './pointValue'

/* What a point is worth. RWD ids refer to wiki/rewards.md. */

describe('what a point can be worth (RWD-31)', () => {
  it('is more than nothing, to two decimal places', () => {
    expect(isPointAmount(1)).toBe(true)
    expect(isPointAmount(0.5)).toBe(true)
    expect(isPointAmount(0.07)).toBe(true)
    expect(isPointAmount(12.25)).toBe(true)
    expect(isPointAmount(0)).toBe(false)
    expect(isPointAmount(-1)).toBe(false)
    expect(isPointAmount(0.001)).toBe(false)
    expect(isPointAmount(MAX_POINT_AMOUNT + 1)).toBe(false)
    expect(isPointAmount(Number.NaN)).toBe(false)
  })

  it('is in a currency of its own, however it is written', () => {
    expect(isCurrency('UAH')).toBe(true)
    expect(isCurrency('€')).toBe(true)
    expect(isCurrency('   ')).toBe(false)
    expect(isCurrency('a'.repeat(9))).toBe(false)
    expect(isCurrency('UAH\nEUR')).toBe(false)
  })

  it('is UAH until another is named', () => {
    expect(createPointValue(1)).toEqual({ amount: 1, currency: DEFAULT_CURRENCY, otherCurrencies: [] })
  })

  it('trims the currency and rounds the amount to the penny', () => {
    expect(createPointValue(2.5, '  zł ')).toEqual({ amount: 2.5, currency: 'zł', otherCurrencies: [] })
  })

  it('refuses an amount or a currency that will not do', () => {
    expect(() => createPointValue(0)).toThrow(InvalidPointValueError)
    expect(() => createPointValue(1, '')).toThrow(InvalidPointValueError)
  })
})

describe('what points come to in money (RWD-32)', () => {
  const UAH = createPointValue(2.5)

  it('is the points at the rate, to the penny', () => {
    expect(moneyFor(10, UAH)).toBe(25)
    expect(moneyFor(3, createPointValue(0.07))).toBe(0.21)
  })

  it('is nothing at all while no rate is set', () => {
    expect(moneyFor(10, null)).toBeNull()
  })

  it('follows a balance below zero (RWD-17)', () => {
    expect(moneyFor(-4, UAH)).toBe(-10)
  })
})

describe('what money comes to in points (RWD-47)', () => {
  const UAH = createPointValue(2.5)

  it('is the fewest whole points worth at least that much', () => {
    expect(pointsForMoney(25, 'UAH', UAH)).toBe(10)
    expect(pointsForMoney(26, 'UAH', UAH)).toBe(11)
    expect(pointsForMoney(0.21, 'UAH', createPointValue(0.07))).toBe(3)
  })

  it('is nothing at all while no rate is set, or the rate is in another currency', () => {
    expect(pointsForMoney(25, 'UAH', null)).toBeNull()
    expect(pointsForMoney(25, 'EUR', UAH)).toBeNull()
  })

  it('takes a currency written in another case for the same one', () => {
    expect(isSameCurrency(' uah', 'UAH')).toBe(true)
    expect(isSameCurrency('UAH', 'EUR')).toBe(false)
    expect(pointsForMoney(25, 'uah', UAH)).toBe(10)
  })
})

describe('other currencies (RWD-49)', () => {
  const UAH = createPointValue(1, 'UAH', [{ currency: 'USD', amount: 41.5 }])

  it('says what one of each is worth in the main currency, to four places', () => {
    expect(isCurrencyRate(41.5)).toBe(true)
    expect(isCurrencyRate(0.0241)).toBe(true)
    expect(isCurrencyRate(0.00001)).toBe(false)
    expect(isCurrencyRate(0)).toBe(false)
    expect(createPointValue(1, 'USD', [{ currency: ' UAH ', amount: 0.0241 }]).otherCurrencies).toEqual([
      { currency: 'UAH', amount: 0.0241 },
    ])
  })

  it('lists the main currency first, then the others as they were added', () => {
    expect(currenciesOf(UAH)).toEqual(['UAH', 'USD'])
    expect(currenciesOf(null)).toEqual([])
  })

  it('knows a currency whatever its case, in its own spelling', () => {
    expect(knownCurrency(UAH, 'usd')).toBe('USD')
    expect(knownCurrency(UAH, 'EUR')).toBeNull()
  })

  it('never names a currency twice, the main one included', () => {
    expect(() => createPointValue(1, 'UAH', [{ currency: 'uah', amount: 1 }])).toThrow(InvalidPointValueError)
    expect(withOtherCurrencies(UAH, [{ currency: 'USD', amount: 41 }, { currency: 'usd', amount: 42 }])).toBeNull()
  })

  it('holds no more than a few', () => {
    const many = ['USD', 'EUR', 'GBP', 'PLN', 'CZK'].map((currency) => ({ currency, amount: 40 }))

    expect(withOtherCurrencies(UAH, many.slice(0, MAX_OTHER_CURRENCIES))).not.toBeNull()
    expect(withOtherCurrencies(UAH, many)).toBeNull()
  })

  it('counts money in another currency through the main one', () => {
    // $1 000 is ₴41 500, which is 41 500 points at ₴1 a point.
    expect(pointsForMoney(1000, 'USD', UAH)).toBe(41500)
    // At ₴2.50 a point, $1 is ₴41.50 is 16.6 points: 17 cover it.
    expect(pointsForMoney(1, 'USD', createPointValue(2.5, 'UAH', [{ currency: 'USD', amount: 41.5 }]))).toBe(17)
    // A weaker currency said in a stronger one: ₴100 at $0.0241 is $2.41, 3 points at $1 a point.
    expect(pointsForMoney(100, 'UAH', createPointValue(1, 'USD', [{ currency: 'UAH', amount: 0.0241 }]))).toBe(3)
  })

  it('counts a price of the most money there can be exactly, at a penny a point', () => {
    const value = createPointValue(0.01, 'UAH', [{ currency: 'USD', amount: 41.5123 }])

    expect(pointsForMoney(999_999_999.99, 'USD', value)).toBe(4_151_229_999_959)
  })
})
