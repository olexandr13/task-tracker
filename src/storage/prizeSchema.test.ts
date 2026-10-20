import { describe, expect, it } from 'vitest'
import { createPrize, priceInMoney, priceInPoints } from '../core'
import { PRIZE_SCHEMA_VERSION, readPrize, toStoredPrize } from './prizeSchema'

/* Reading the wishlist back. STORE ids refer to wiki/storage.md, RWD ids to wiki/rewards.md. */

const AT = new Date('2026-09-17T09:00:00.000Z')
const CHOCOLATE = createPrize('A bar of chocolate', priceInPoints(20), 'prize', AT)
const PHONE = createPrize('A new phone', priceInMoney(30000, 'UAH'), 'wish', AT)

describe('readPrize (STORE-43, STORE-24)', () => {
  it('reads back what was saved, priced in points or in money (RWD-47)', () => {
    expect(readPrize(toStoredPrize(CHOCOLATE))).toEqual(CHOCOLATE)
    expect(readPrize(toStoredPrize(PHONE))).toEqual(PHONE)
  })

  it('reads a prize from before there were wishes as a prize priced in its points', () => {
    const { id, name, createdAt } = CHOCOLATE

    expect(readPrize({ version: 1, prize: { id, name, points: 20, createdAt } })).toEqual(CHOCOLATE)
  })

  it('reads a wish from before money as priced in its points (RWD-47)', () => {
    const { id, createdAt } = PHONE
    const saved = { id, name: 'A new phone', points: 5000, kind: 'wish', boughtAt: null, createdAt }

    expect(readPrize({ version: 2, prize: saved })).toEqual({ ...PHONE, price: { in: 'points', points: 5000 } })
  })

  it('trusts nothing in a version it does not know, or not shaped as a prize', () => {
    expect(readPrize({ version: 99, prize: CHOCOLATE })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, id: '' } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, name: '  ' } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, price: { in: 'points', points: 0 } } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, price: { in: 'points', points: 2.5 } } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...PHONE, price: { in: 'money', amount: 0, currency: 'UAH' } } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...PHONE, price: { in: 'money', amount: 10, currency: ' ' } } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, price: 20 } })).toBeNull()
    expect(readPrize({ version: 2, prize: { ...CHOCOLATE, kind: 'prize', points: 0 } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, createdAt: 'someday' } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION })).toBeNull()
    expect(readPrize(null)).toBeNull()
  })
})
