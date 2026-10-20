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
  isPrizeMoney,
  isPrizeNameTaken,
  isPrizePoints,
  MAX_PRIZE_MONEY,
  MAX_PRIZE_POINTS,
  nextPrize,
  pointsShort,
  priceIn,
  priceInMoney,
  priceInPoints,
  priceMoney,
  priceOf,
  pricePoints,
  priceUnit,
  renamePrize,
  repricePrize,
  sortPrizes,
  type Prize,
} from './prize'
import { createPointValue } from './pointValue'

/* The wishlist. RWD ids refer to wiki/rewards.md. */

const NOW = new Date(2026, 8, 17, 9, 0)

function prize(name: string, points: number): Prize {
  return createPrize(name, priceInPoints(points), 'prize', NOW)
}

function wish(name: string, points: number): Prize {
  return createPrize(name, priceInPoints(points), 'wish', NOW)
}

/** A wish priced in money (RWD-47). */
function wishInMoney(name: string, amount: number, currency = 'UAH'): Prize {
  return createPrize(name, priceInMoney(amount, currency), 'wish', NOW)
}

describe('naming a prize (RWD-33)', () => {
  it('takes a name and a price', () => {
    const made = prize('A bar of chocolate', 20)

    expect(made).toMatchObject({
      name: 'A bar of chocolate',
      price: { in: 'points', points: 20 },
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
    expect(() => priceInPoints(0)).toThrow(InvalidPrizeError)
  })
})

describe('changing a prize (RWD-34)', () => {
  it('renames it without touching anything else', () => {
    const made = prize('chocolate', 20)

    expect(renamePrize(made, 'A bar of chocolate')).toEqual({ ...made, name: 'A bar of chocolate' })
  })

  it('reprices it', () => {
    const made = prize('chocolate', 20)

    expect(repricePrize(made, priceInPoints(25)).price).toEqual({ in: 'points', points: 25 })
  })

  it('hands back the very same prize where nothing changed', () => {
    const made = prize('chocolate', 20)

    expect(renamePrize(made, 'chocolate')).toBe(made)
    expect(repricePrize(made, priceInPoints(20))).toBe(made)
  })

  it('never modifies the prize it was given', () => {
    const made = prize('chocolate', 20)
    renamePrize(made, 'sweets')
    repricePrize(made, priceInPoints(99))

    expect(made).toMatchObject({ name: 'chocolate', price: { in: 'points', points: 20 } })
  })

  it('refuses a name or a price that will not do', () => {
    const made = prize('chocolate', 20)

    expect(() => renamePrize(made, '')).toThrow(InvalidPrizeError)
    expect(() => repricePrize(made, { in: 'points', points: -1 })).toThrow(InvalidPrizeError)
  })
})

describe('the prizes together (RWD-35)', () => {
  it('shows the cheapest first, then by name', () => {
    const phone = prize('A new phone', 5000)
    const chocolate = prize('Chocolate', 20)
    const coffee = prize('Coffee', 20)

    expect(sortPrizes([phone, coffee, chocolate], null).map((one) => one.name)).toEqual([
      'Chocolate',
      'Coffee',
      'A new phone',
    ])
  })

  it('never modifies the array it was given', () => {
    const prizes = [prize('phone', 5000), prize('chocolate', 20)]
    sortPrizes(prizes, null)

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

    expect(canAfford(chocolate, 20, null)).toBe(true)
    expect(canAfford(chocolate, 19, null)).toBe(false)
    expect(pointsShort(chocolate, 19, null)).toBe(1)
    expect(pointsShort(chocolate, 20, null)).toBe(0)
    expect(pointsShort(chocolate, 25, null)).toBe(0)
  })

  it('counts a balance below zero as the whole price still to earn (RWD-17)', () => {
    expect(pointsShort(prize('chocolate', 20), -5, null)).toBe(25)
  })
})

describe('what to save up for (RWD-37)', () => {
  const chocolate = prize('Chocolate', 20)
  const book = prize('A book', 200)
  const phone = prize('A new phone', 5000)
  const all = [phone, chocolate, book]

  it('is the cheapest prize out of reach', () => {
    expect(nextPrize(all, 25, null)?.name).toBe('A book')
    expect(nextPrize(all, 0, null)?.name).toBe('Chocolate')
  })

  it('is nothing once every prize is within reach, or there are none', () => {
    expect(nextPrize(all, 5000, null)).toBeNull()
    expect(nextPrize([], 10, null)).toBeNull()
  })

  it('lists what the balance reaches, cheapest first', () => {
    expect(affordablePrizes(all, 200, null).map((one) => one.name)).toEqual(['Chocolate', 'A book'])
    expect(affordablePrizes(all, 0, null)).toEqual([])
  })
})

describe('prizes and wishes (RWD-40)', () => {
  const LATER = new Date(2026, 8, 18, 9, 0)

  it('keeps the two apart', () => {
    const chocolate = prize('Chocolate', 20)
    const phone = wish('A new phone', 5000)

    expect(prizesOfKind([phone, chocolate], 'prize', null)).toEqual([chocolate])
    expect(prizesOfKind([phone, chocolate], 'wish', null)).toEqual([phone])
  })

  it('buys a wish once, which takes it off what the points can buy', () => {
    const bought = markBought(wish('A new phone', 5000), LATER)

    expect(bought.boughtAt).toBe(LATER.toISOString())
    expect(isAvailable(bought)).toBe(false)
    expect(canAfford(bought, 10000, null)).toBe(false)
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

    expect(sortPrizes([bought, bike, chocolate], null).map((one) => one.name)).toEqual([
      'Chocolate',
      'A bicycle',
      'A trip',
    ])
  })

  it('is never saving up for what has been bought already (RWD-37)', () => {
    const bought = markBought(wish('A trip', 100), LATER)
    const bike = wish('A bicycle', 2000)

    expect(nextPrize([bought, bike], 50, null)?.name).toBe('A bicycle')
    expect(nextPrize([bought], 50, null)).toBeNull()
    expect(affordablePrizes([bought], 500, null)).toEqual([])
  })
})

describe('a wish priced in money (RWD-47)', () => {
  const UAH = createPointValue(10, 'UAH')

  it('keeps the money it was priced at, to the penny, in its currency', () => {
    expect(wishInMoney('A new phone', 30000).price).toEqual({ in: 'money', amount: 30000, currency: 'UAH' })
    expect(priceInMoney(62.5, '  zł ')).toEqual({ in: 'money', amount: 62.5, currency: 'zł' })
  })

  it('refuses money that is nothing, finer than a penny, absurd, or in no currency', () => {
    expect(isPrizeMoney(0)).toBe(false)
    expect(isPrizeMoney(0.001)).toBe(false)
    expect(isPrizeMoney(MAX_PRIZE_MONEY + 1)).toBe(false)
    expect(isPrizeMoney(0.01)).toBe(true)
    expect(() => priceInMoney(0, 'UAH')).toThrow(InvalidPrizeError)
    expect(() => priceInMoney(100, '  ')).toThrow(InvalidPrizeError)
  })

  it('costs the fewest points worth that much at the rate as it stands', () => {
    expect(pricePoints(wishInMoney('A new phone', 30000), UAH)).toBe(3000)
    // 25 UAH is two and a half points: three are needed to cover it.
    expect(pricePoints(wishInMoney('A cake', 25), UAH)).toBe(3)
    // A point worth more brings it nearer.
    expect(pricePoints(wishInMoney('A new phone', 30000), createPointValue(20, 'UAH'))).toBe(1500)
    expect(pricePoints(wishInMoney('A pen', 0.07), createPointValue(0.07, 'UAH'))).toBe(1)
  })

  it('counts a currency written in another case as the same one', () => {
    expect(pricePoints(wishInMoney('A new phone', 30000, 'uah'), UAH)).toBe(3000)
  })

  it('cannot be counted in points with no rate, or a rate in another currency', () => {
    const phone = wishInMoney('A new phone', 30000)
    const usd = createPointValue(1, 'USD')

    expect(pricePoints(phone, null)).toBeNull()
    expect(pricePoints(phone, usd)).toBeNull()
    expect(canAfford(phone, 1_000_000, null)).toBe(false)
    expect(pointsShort(phone, 0, usd)).toBeNull()
    expect(nextPrize([phone], 0, null)).toBeNull()
  })

  it('is within reach once the balance covers its points at the rate', () => {
    const phone = wishInMoney('A new phone', 30000)

    expect(canAfford(phone, 3000, UAH)).toBe(true)
    expect(canAfford(phone, 2999, UAH)).toBe(false)
    expect(pointsShort(phone, 25, UAH)).toBe(2975)
    expect(nextPrize([phone], 25, UAH)).toBe(phone)
  })

  it('says its money as it was set, and a price in points at the rate', () => {
    expect(priceMoney(wishInMoney('A cake', 25), UAH)).toEqual({ amount: 25, currency: 'UAH' })
    expect(priceMoney(wishInMoney('A cake', 25), null)).toEqual({ amount: 25, currency: 'UAH' })
    expect(priceMoney(wish('A bicycle', 200), UAH)).toEqual({ amount: 2000, currency: 'UAH' })
    expect(priceMoney(wish('A bicycle', 200), null)).toBeNull()
  })

  it('sorts among the rest by its points at the rate, and after them where the rate cannot count it', () => {
    const phone = wishInMoney('A new phone', 30000)
    const bike = wish('A bicycle', 2000)
    const trip = wishInMoney('A trip', 5000, 'EUR')
    const cake = wishInMoney('A cake', 25, 'EUR')

    expect(sortPrizes([phone, trip, bike, cake], UAH).map((one) => one.name)).toEqual([
      'A bicycle',
      'A new phone',
      'A cake',
      'A trip',
    ])
  })

  it('reprices from points to money and back, handing back the same one where nothing changed', () => {
    const bike = wish('A bicycle', 200)
    const inMoney = repricePrize(bike, priceInMoney(2000, 'UAH'))

    expect(inMoney.price).toEqual({ in: 'money', amount: 2000, currency: 'UAH' })
    expect(repricePrize(inMoney, priceInMoney(2000, 'UAH'))).toBe(inMoney)
    expect(repricePrize(inMoney, priceInPoints(200)).price).toEqual({ in: 'points', points: 200 })
  })
})

describe('what a price is typed in (RWD-47)', () => {
  const UAH = createPointValue(10, 'UAH')

  it('is the rate’s currency for a wish, wherever a point has a value', () => {
    expect(priceUnit('wish', UAH)).toEqual({ in: 'money', currency: 'UAH' })
    expect(priceUnit('wish', UAH, priceInPoints(200))).toEqual({ in: 'money', currency: 'UAH' })
    expect(priceUnit('wish', UAH, priceInMoney(50, 'EUR'))).toEqual({ in: 'money', currency: 'UAH' })
  })

  it('is points for a prize, and for a wish while a point has no value', () => {
    expect(priceUnit('prize', UAH)).toEqual({ in: 'points' })
    expect(priceUnit('wish', null)).toEqual({ in: 'points' })
    expect(priceUnit('wish', null, priceInPoints(200))).toEqual({ in: 'points' })
  })

  it('is its own currency for one priced in money while there is no rate to say it in another', () => {
    expect(priceUnit('wish', null, priceInMoney(30000, 'UAH'))).toEqual({ in: 'money', currency: 'UAH' })
  })

  it('starts the box at the price said in it, or empty where it cannot be said', () => {
    const money = { in: 'money', currency: 'UAH' } as const

    expect(priceIn(priceInMoney(30000, 'UAH'), money, UAH)).toBe(30000)
    expect(priceIn(priceInPoints(200), money, UAH)).toBe(2000)
    expect(priceIn(priceInPoints(200), { in: 'points' }, null)).toBe(200)
    // Money in another currency would mean something else in this one.
    expect(priceIn(priceInMoney(50, 'EUR'), money, UAH)).toBeNull()
  })

  it('reads what is typed as a price in that unit, or not at all', () => {
    expect(priceOf(30000, { in: 'money', currency: 'UAH' })).toEqual({ in: 'money', amount: 30000, currency: 'UAH' })
    expect(priceOf(12.5, { in: 'money', currency: 'UAH' })).toEqual({ in: 'money', amount: 12.5, currency: 'UAH' })
    expect(priceOf(12.5, { in: 'points' })).toBeNull()
    expect(priceOf(0, { in: 'money', currency: 'UAH' })).toBeNull()
    expect(priceOf(10.005, { in: 'money', currency: 'UAH' })).toBeNull()
    expect(priceOf(20, { in: 'points' })).toEqual({ in: 'points', points: 20 })
  })
})
