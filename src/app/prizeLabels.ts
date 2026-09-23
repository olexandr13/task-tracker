import type { PrizeKind } from '../core'

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

export const PRIZE_WORDS: Record<PrizeKind, PrizeKindWords> = {
  prize: {
    one: 'prize',
    addPlaceholder: 'Add a prize',
    hint: 'Small things, as often as you can afford them: a square of chocolate, a coffee, five minutes of scrolling. Redeeming one leaves it here for next time.',
    empty: 'No prizes yet. Name one above — a square of chocolate, a coffee — and say what it costs.',
    taken: 'There is a prize called that already.',
  },
  wish: {
    one: 'wish',
    addPlaceholder: 'Add a wish',
    hint: 'The big ones, bought once: a new phone, a bicycle, a trip. Buying one takes it off the list and leaves it here as bought.',
    empty: 'Nothing wished for yet. Name something big above — a bicycle, a trip — and price it in points.',
    taken: 'There is a wish called that already.',
  },
}
