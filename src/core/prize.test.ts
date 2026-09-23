import { describe, expect, it } from 'vitest'
import {
  affordablePrizes,
  canAfford,
  isAvailable,
  markBought,
  prizesOfKind,
  putBack,
  createPrize,
  findPrize,
  InvalidPrizeError,
  isPrizeName,
  isPrizeNameTaken,
  isPrizePoints,
  MAX_PRIZE_POINTS,
  nextPrize,
  pointsShort,
  renamePrize,
  repricePrize,
  sortPrizes,
  type Prize,
} from './prize'

/* The wishlist. RWD ids refer to wiki/rewards.md. */

const NOW = new Date(2026, 8, 17, 9, 0)

function prize(name: string, points: number): Prize {
  return createPrize(name, points, 'prize', NOW)
}

function wish(name: string, points: number): Prize {
  return createPrize(name, points, 'wish', NOW)
}

describe('naming a prize (RWD-33)', () => {
  it('takes a name and a price', () => {
    const made = prize('A bar of chocolate', 20)

    expect(made).toMatchObject({
      name: 'A bar of chocolate',
      points: 20,
      kind: 'prize',
      boughtAt: null,
      createdAt: NOW.toISOString(),
    })
    expect(made.id).not.toBe('')
  })

  it('squeezes the spaces in a name and trims its ends', () => {
    expect(prize('  A new   phone  ', 5000).name).toBe('A new phone')
  })

  it('refuses a name that is nothing, or too long, or on two lines', () => {
    expect(isPrizeName('   ')).toBe(false)
    expect(isPrizeName('a'.repeat(61))).toBe(false)
    expect(isPrizeName('chocolate\nbicycle')).toBe(false)
    expect(() => prize('  ', 20)).toThrow(InvalidPrizeError)
  })

  it('refuses a price that is not a whole number of points, from 1 (RWD-33)', () => {
    expect(isPrizePoints(0)).toBe(false)
    expect(isPrizePoints(1.5)).toBe(false)
    expect(isPrizePoints(MAX_PRIZE_POINTS + 1)).toBe(false)
    expect(isPrizePoints(1)).toBe(true)
    expect(() => prize('chocolate', 0)).toThrow(InvalidPrizeError)
  })
})

describe('changing a prize (RWD-34)', () => {
  it('renames it without touching anything else', () => {
    const made = prize('chocolate', 20)

    expect(renamePrize(made, 'A bar of chocolate')).toEqual({ ...made, name: 'A bar of chocolate' })
  })

  it('reprices it', () => {
    const made = prize('chocolate', 20)

    expect(repricePrize(made, 25).points).toBe(25)
  })

  it('hands back the very same prize where nothing changed', () => {
    const made = prize('chocolate', 20)

    expect(renamePrize(made, 'chocolate')).toBe(made)
    expect(repricePrize(made, 20)).toBe(made)
  })

  it('never modifies the prize it was given', () => {
    const made = prize('chocolate', 20)
    renamePrize(made, 'sweets')
    repricePrize(made, 99)

    expect(made).toMatchObject({ name: 'chocolate', points: 20 })
  })

  it('refuses a name or a price that will not do', () => {
    const made = prize('chocolate', 20)

    expect(() => renamePrize(made, '')).toThrow(InvalidPrizeError)
    expect(() => repricePrize(made, -1)).toThrow(InvalidPrizeError)
  })
})

describe('the prizes together (RWD-35)', () => {
  it('shows the cheapest first, then by name', () => {
    const phone = prize('A new phone', 5000)
    const chocolate = prize('Chocolate', 20)
    const coffee = prize('Coffee', 20)

    expect(sortPrizes([phone, coffee, chocolate]).map((one) => one.name)).toEqual([
      'Chocolate',
      'Coffee',
      'A new phone',
    ])
  })

  it('never modifies the array it was given', () => {
    const prizes = [prize('phone', 5000), prize('chocolate', 20)]
    sortPrizes(prizes)

    expect(prizes.map((one) => one.name)).toEqual(['phone', 'chocolate'])
  })

  it('finds one by id, and says so when there is none', () => {
    const chocolate = prize('chocolate', 20)

    expect(findPrize([chocolate], chocolate.id)).toBe(chocolate)
    expect(findPrize([chocolate], 'gone')).toBeNull()
  })

  it('knows a name another prize has already, whatever its case (RWD-33)', () => {
    const chocolate = prize('Chocolate', 20)

    expect(isPrizeNameTaken([chocolate], 'chocolate')).toBe(true)
    expect(isPrizeNameTaken([chocolate], '  CHOCOLATE ')).toBe(true)
    expect(isPrizeNameTaken([chocolate], 'Chocolate', chocolate.id)).toBe(false)
    expect(isPrizeNameTaken([chocolate], 'Coffee')).toBe(false)
  })
})

describe('what the balance reaches (RWD-36)', () => {
  it('is within reach once the balance covers it', () => {
    const chocolate = prize('chocolate', 20)

    expect(canAfford(chocolate, 20)).toBe(true)
    expect(canAfford(chocolate, 19)).toBe(false)
    expect(pointsShort(chocolate, 19)).toBe(1)
    expect(pointsShort(chocolate, 20)).toBe(0)
    expect(pointsShort(chocolate, 25)).toBe(0)
  })

  it('counts a balance below zero as the whole price still to earn (RWD-17)', () => {
    expect(pointsShort(prize('chocolate', 20), -5)).toBe(25)
  })
})

describe('what to save up for (RWD-37)', () => {
  const chocolate = prize('Chocolate', 20)
  const book = prize('A book', 200)
  const phone = prize('A new phone', 5000)
  const all = [phone, chocolate, book]

  it('is the cheapest prize out of reach', () => {
    expect(nextPrize(all, 25)?.name).toBe('A book')
    expect(nextPrize(all, 0)?.name).toBe('Chocolate')
  })

  it('is nothing once every prize is within reach, or there are none', () => {
    expect(nextPrize(all, 5000)).toBeNull()
    expect(nextPrize([], 10)).toBeNull()
  })

  it('lists what the balance reaches, cheapest first', () => {
    expect(affordablePrizes(all, 200).map((one) => one.name)).toEqual(['Chocolate', 'A book'])
    expect(affordablePrizes(all, 0)).toEqual([])
  })
})

describe('prizes and wishes (RWD-40)', () => {
  const LATER = new Date(2026, 8, 18, 9, 0)

  it('keeps the two apart', () => {
    const chocolate = prize('Chocolate', 20)
    const phone = wish('A new phone', 5000)

    expect(prizesOfKind([phone, chocolate], 'prize')).toEqual([chocolate])
    expect(prizesOfKind([phone, chocolate], 'wish')).toEqual([phone])
  })

  it('buys a wish once, which takes it off what the points can buy', () => {
    const bought = markBought(wish('A new phone', 5000), LATER)

    expect(bought.boughtAt).toBe(LATER.toISOString())
    expect(isAvailable(bought)).toBe(false)
    expect(canAfford(bought, 10000)).toBe(false)
    // Buying it again changes nothing: it was bought when it was bought.
    expect(markBought(bought, NOW)).toBe(bought)
  })

  it('leaves a prize as it is: it comes round again', () => {
    const chocolate = prize('Chocolate', 20)

    expect(markBought(chocolate, LATER)).toBe(chocolate)
    expect(isAvailable(chocolate)).toBe(true)
  })

  it('puts a bought wish back, for undoing what bought it (RWD-41)', () => {
    const bought = markBought(wish('A new phone', 5000), LATER)

    expect(putBack(bought).boughtAt).toBeNull()
    expect(isAvailable(putBack(bought))).toBe(true)
  })

  it('shows what is still to buy first, and what was bought at the end (RWD-35)', () => {
    const chocolate = prize('Chocolate', 20)
    const bike = wish('A bicycle', 2000)
    const bought = markBought(wish('A trip', 100), LATER)

    expect(sortPrizes([bought, bike, chocolate]).map((one) => one.name)).toEqual([
      'Chocolate',
      'A bicycle',
      'A trip',
    ])
  })

  it('is never saving up for what has been bought already (RWD-37)', () => {
    const bought = markBought(wish('A trip', 100), LATER)
    const bike = wish('A bicycle', 2000)

    expect(nextPrize([bought, bike], 50)?.name).toBe('A bicycle')
    expect(nextPrize([bought], 50)).toBeNull()
    expect(affordablePrizes([bought], 500)).toEqual([])
  })
})
