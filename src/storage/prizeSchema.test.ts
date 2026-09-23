import { describe, expect, it } from 'vitest'
import { createPrize } from '../core'
import { PRIZE_SCHEMA_VERSION, readPrize, toStoredPrize } from './prizeSchema'

/* Reading the wishlist back. STORE ids refer to wiki/storage.md. */

const AT = new Date('2026-09-17T09:00:00.000Z')
const CHOCOLATE = createPrize('A bar of chocolate', 20, 'prize', AT)

describe('readPrize (STORE-43, STORE-24)', () => {
  it('reads back what was saved', () => {
    expect(readPrize(toStoredPrize(CHOCOLATE))).toEqual(CHOCOLATE)
  })

  it('trusts nothing in a version it does not know, or not shaped as a prize', () => {
    expect(readPrize({ version: 99, prize: CHOCOLATE })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, id: '' } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, name: '  ' } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, points: 0 } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, points: 2.5 } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION, prize: { ...CHOCOLATE, createdAt: 'someday' } })).toBeNull()
    expect(readPrize({ version: PRIZE_SCHEMA_VERSION })).toBeNull()
    expect(readPrize(null)).toBeNull()
  })
})
