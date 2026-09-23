import { describe, expect, it } from 'vitest'
import {
  createPointValue,
  DEFAULT_CURRENCY,
  InvalidPointValueError,
  isCurrency,
  isPointAmount,
  MAX_POINT_AMOUNT,
  moneyFor,
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
    expect(createPointValue(1)).toEqual({ amount: 1, currency: DEFAULT_CURRENCY })
  })

  it('trims the currency and rounds the amount to the penny', () => {
    expect(createPointValue(2.5, '  zł ')).toEqual({ amount: 2.5, currency: 'zł' })
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
