import { chestQuarter, openChest, type ChestOpen } from '../core'

/**
 * The reel an opening is shown on (CHST-14): a strip of cards that runs past a
 * marker and stops on the one the opening drew.
 *
 * Everything here is presentation. What the chest gives was drawn and written
 * before the reel is built (CHST-16), and the reel is built *around* it: the
 * card under the marker is the opening's own, and every other card is a decoy
 * drawn just as an opening is — any amount from 1 to the jackpot, each as
 * likely as any other (CHST-10) — so what runs past is a fair picture of the
 * odds.
 */

/** One card on the reel: what it pays. Its colour follows from that and the jackpot (`chestQuarter`). */
export interface ReelCard {
  readonly points: number
}

export interface Reel {
  readonly cards: readonly ReelCard[]
  /** What the opening played for, which every card's colour is measured against. */
  readonly jackpot: number
  /** Which card is the opening's own. */
  readonly winner: number
  /**
   * Where the marker starts and where it stops, counted in cards from the
   * strip's left edge: 4.5 is the middle of the fifth card. It stops somewhere
   * inside the winner, never on an edge, so there is no reading it two ways.
   */
  readonly from: number
  readonly to: number
}

/** How many cards run past the marker before the winner comes up. */
export const REEL_RUN = 34

/** Cards to the left of the marker at rest, and to the right of the winner, so the window is never half empty. */
const LEAD = 4
const TAIL = 4

/**
 * How often the card after the winner is from a higher quarter of the jackpot,
 * with the reel stopping just short of it — the "nearly" a third reel gives a
 * slot machine. Disclosed in CHST-15: a show, which never touches what was
 * drawn.
 */
export const NEAR_MISS = 0.35

/**
 * How the reel slows: quick off the mark, a long crawl at the end. Written as
 * the CSS `cubic-bezier` it is drawn with, so the ticks (`reelTicks`) land on
 * the very frames the cards cross the marker.
 */
export const REEL_EASE = [0.15, 0.55, 0.25, 1] as const

export const REEL_EASE_CSS = `cubic-bezier(${REEL_EASE.join(', ')})`

/**
 * Builds the reel for an opening that has already been drawn. `random` is
 * injectable so a test can pin the decoys and the near miss.
 */
export function buildReel(opening: ChestOpen, random: () => number = Math.random): Reel {
  const winner = LEAD + REEL_RUN
  const cards: ReelCard[] = []

  for (let index = 0; index < winner + 1 + TAIL; index++) {
    cards.push({ points: index === winner ? opening.points : openChest(opening.jackpot, random).points })
  }

  const richer = nextQuarterUp(opening, random)
  const nearMiss = richer !== null && random() < NEAR_MISS
  if (nearMiss) cards[winner + 1] = { points: richer }

  return {
    cards,
    jackpot: opening.jackpot,
    winner,
    from: LEAD + 0.5 + between(-0.3, 0.3, random),
    // A near miss stops at the far edge of the winner, the richer card a hair
    // away; otherwise anywhere comfortably inside it.
    to: winner + (nearMiss ? between(0.82, 0.93, random) : between(0.14, 0.86, random)),
  }
}

/**
 * When each card's edge crosses the marker, in milliseconds from the reel
 * starting to run, over a run of `ms`. One tick of the reel for each.
 */
export function reelTicks(reel: Pick<Reel, 'from' | 'to'>, ms: number): number[] {
  const ticks: number[] = []
  const run = reel.to - reel.from

  for (let edge = Math.floor(reel.from) + 1; edge <= reel.to; edge++) {
    ticks.push(Math.round(reelTimeAt((edge - reel.from) / run) * ms))
  }
  return ticks
}

/**
 * How far through its time the reel is when it has covered `progress` of its
 * run (both 0 to 1): the cubic-bezier read backwards. Both halves of the curve
 * rise from 0 to 1, so each is solved by halving.
 */
export function reelTimeAt(progress: number): number {
  const [x1, y1, x2, y2] = REEL_EASE
  let low = 0
  let high = 1

  for (let step = 0; step < 40; step++) {
    const middle = (low + high) / 2
    if (bezier(y1, y2, middle) < progress) low = middle
    else high = middle
  }
  return bezier(x1, x2, (low + high) / 2)
}

/** One coordinate of a cubic Bézier from 0 to 1, with its two handles at `a` and `b`. */
function bezier(a: number, b: number, along: number): number {
  const rest = 1 - along
  return 3 * a * along * rest * rest + 3 * b * along * along * rest + along * along * along
}

/**
 * An amount in the quarter of the jackpot above the opening's own, or null
 * where there is none — the opening already in the top quarter, or a jackpot
 * too small for that quarter to hold a whole number.
 */
function nextQuarterUp({ points, jackpot }: ChestOpen, random: () => number): number | null {
  const quarter = chestQuarter(points, jackpot)
  if (quarter === 4) return null

  const low = Math.floor((quarter * jackpot) / 4) + 1
  const high = Math.floor(((quarter + 1) * jackpot) / 4)
  if (low > high) return null

  return low + Math.floor(random() * (high - low + 1))
}

function between(low: number, high: number, random: () => number): number {
  return low + random() * (high - low)
}
