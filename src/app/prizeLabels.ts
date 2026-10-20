import type { PointValue, PrizeKind } from '../core'
import { currencySign } from './rewardLabels'

/**
 * How the two kinds of thing points are spent on read on screen (RWD-40). What
 * each one *is* lives in ../core/prize; wording is presentation, so it stays here.
 */
export interface PrizeKindWords {
  /** What one of them is called, for a button or a message: `prize`, `wish`. */
  readonly one: string
  /** What the box for a new one says. */
  readonly addPlaceholder: string
  /** What this list is for, said in a line under its name. */
  readonly hint: string
  /** What the page says while the list is empty. */
  readonly empty: string
  /** What is said when a name is on either list already. */
  readonly taken: string
}

/** How a price in money works, said on both lists (RWD-47, RWD-49). */
const PRICED_IN_MONEY =
  'Once a point has a value on "Rules", you price each one in money, in any currency set there, and it costs as many points as its money comes to.'

export const PRIZE_WORDS: Record<PrizeKind, PrizeKindWords> = {
  prize: {
    one: 'prize',
    addPlaceholder: 'Add a prize',
    hint: `Small things, as often as you can afford them: a square of chocolate, a coffee, five minutes of scrolling. Redeeming one leaves it here for next time. ${PRICED_IN_MONEY}`,
    empty: 'No prizes yet. Name one above — a square of chocolate, a coffee — and say what it costs.',
    taken: 'There is a prize called that already.',
  },
  wish: {
    one: 'wish',
    addPlaceholder: 'Add a wish',
    hint: `The big ones, bought once: a new phone, a bicycle, a trip. Buying one takes it off the list and leaves it here as bought. ${PRICED_IN_MONEY}`,
    empty: 'Nothing wished for yet. Name something big above — a bicycle, a trip — and say what it costs.',
    taken: 'There is a wish called that already.',
  },
}

/**
 * What a row priced in money says where no rate counts it in points, so it
 * cannot be bought (RWD-48): why, and what to do about it.
 */
export function describeUncounted(currency: string, value: PointValue | null): string {
  const sign = currencySign(currency)
  return value === null
    ? `Priced in ${sign}, and a point has no value yet, so it can't be bought.`
    : `Priced in ${sign}, which has no rate on "Rules", so it can't be bought. Add one there, or change its price.`
}

/** The link under such a row, which opens Rules (RWD-48). */
export function describeUncountedLink(currency: string, value: PointValue | null): string {
  return value === null ? 'Set what a point is worth' : `Add a rate for ${currencySign(currency)}`
}
