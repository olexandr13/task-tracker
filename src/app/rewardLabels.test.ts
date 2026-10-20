import { describe, expect, it } from 'vitest'
import { createPointValue } from '../core'
import {
  currencySign,
  describeAmount,
  describeCurrencyRate,
  describeMoney,
  describeMoneyAmount,
  describePoints,
  describePointValue,
} from './rewardLabels'

/* How the rewards spell an amount out. RWD ids refer to wiki/rewards.md. */

/** The space a line never breaks at, which sets thousands apart. */
const T = '\u00A0'

describe('describeAmount (RWD-46)', () => {
  it('sets the thousands apart, from four figures on', () => {
    expect(describeAmount(173)).toBe('173')
    expect(describeAmount(1730)).toBe(`1${T}730`)
    expect(describeAmount(100_000)).toBe(`100${T}000`)
    expect(describeAmount(1_000_000)).toBe(`1${T}000${T}000`)
  })

  it('writes pennies only when there are any, and always both figures of them', () => {
    expect(describeAmount(62.5)).toBe('62.50')
    expect(describeAmount(0.21)).toBe('0.21')
    expect(describeAmount(12_345.6)).toBe(`12${T}345.60`)
  })

  it('keeps the sign of an amount below zero (RWD-17)', () => {
    expect(describeAmount(-1234)).toBe(`-1${T}234`)
  })
})

describe('describePoints', () => {
  it('names the points, one or many', () => {
    expect(describePoints(1)).toBe('1 point')
    expect(describePoints(-1)).toBe('-1 point')
    expect(describePoints(4975)).toBe(`4${T}975 points`)
  })
})

describe('describeMoney (RWD-32)', () => {
  it('counts the points in money at the rate, its thousands set apart', () => {
    const tenEach = createPointValue(10)
    expect(describeMoney(173, tenEach)).toBe(`₴1${T}730`)
    expect(describeMoney(100_000, tenEach)).toBe(`₴1${T}000${T}000`)
    expect(describeMoney(25, createPointValue(2.5, '€'))).toBe('€62.50')
  })

  it('says nothing while a point is worth nothing in money', () => {
    expect(describeMoney(173, null)).toBeNull()
  })

  it('spells the rate out as one point’s worth', () => {
    expect(describePointValue(createPointValue(10))).toBe('1 point = ₴10')
    expect(describePointValue(createPointValue(2.5))).toBe('1 point = ₴2.50')
  })

  it('spells another currency’s rate out in the main one, to as many places as it has (RWD-49)', () => {
    const value = createPointValue(1, 'UAH', [
      { currency: 'USD', amount: 41.5 },
      { currency: 'EUR', amount: 45 },
    ])
    expect(describeCurrencyRate(value.otherCurrencies[0], value)).toBe('$1 = ₴41.50')
    expect(describeCurrencyRate(value.otherCurrencies[1], value)).toBe('€1 = ₴45')
    const dollars = createPointValue(1, 'USD', [{ currency: 'UAH', amount: 0.0241 }])
    expect(describeCurrencyRate(dollars.otherCurrencies[0], dollars)).toBe('₴1 = $0.0241')
  })
})

describe('the currency’s sign (RWD-50)', () => {
  it('is the sign a currency code is known by', () => {
    expect(currencySign('UAH')).toBe('₴')
    expect(currencySign('usd')).toBe('$')
    expect(currencySign('EUR')).toBe('€')
    expect(currencySign('PLN')).toBe('zł')
  })

  it('is the currency as written where it is no code, or a code with no sign', () => {
    expect(currencySign('CHF')).toBe('CHF')
    expect(currencySign('hours')).toBe('hours')
    expect(currencySign('€')).toBe('€')
  })

  it('goes in front of the amount where it is one character, and after it where it is longer', () => {
    expect(describeMoneyAmount({ amount: 1000, currency: 'USD' })).toBe(`$1${T}000`)
    expect(describeMoneyAmount({ amount: -5, currency: 'USD' })).toBe('-$5')
    expect(describeMoneyAmount({ amount: 100, currency: 'PLN' })).toBe('100 zł')
    expect(describeMoneyAmount({ amount: 3, currency: 'hours' })).toBe('3 hours')
  })
})
