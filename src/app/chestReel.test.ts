import { describe, expect, it } from 'vitest'
import { chestQuarter, type ChestOpen } from '../core'
import { buildReel, REEL_RUN, reelTicks, reelTimeAt } from './chestReel'

/* The reel an opening is shown on. CHST ids refer to wiki/chest.md. */

const OPENING: ChestOpen = { points: 14, jackpot: 20 }

/** A `random` that always answers the same. */
const always = (value: number) => () => value

describe('the reel', () => {
  it('puts the card the opening drew under the marker where it stops (CHST-16)', () => {
    for (let run = 0; run < 50; run++) {
      const reel = buildReel(OPENING)

      expect(reel.cards[reel.winner]).toEqual({ points: 14 })
      expect(Math.floor(reel.to)).toBe(reel.winner)
    }
  })

  it('stops inside the card, never on an edge, so there is no reading it two ways', () => {
    for (let run = 0; run < 200; run++) {
      const reel = buildReel(OPENING)
      const along = reel.to - reel.winner

      expect(along).toBeGreaterThan(0.1)
      expect(along).toBeLessThan(0.95)
    }
  })

  it('runs past the same number of cards whatever is inside (CHST-14)', () => {
    const pinch = buildReel({ points: 1, jackpot: 20 })
    const jackpot = buildReel({ points: 20, jackpot: 20 })

    expect(pinch.winner).toBe(jackpot.winner)
    expect(pinch.cards).toHaveLength(jackpot.cards.length)
    expect(pinch.to - pinch.from).toBeGreaterThan(REEL_RUN - 1)
    expect(pinch.to - pinch.from).toBeLessThan(REEL_RUN + 1)
  })

  it('fills the rest with cards drawn as openings are, none above the jackpot (CHST-10)', () => {
    const reel = buildReel(OPENING)

    for (const card of reel.cards) {
      expect(Number.isInteger(card.points)).toBe(true)
      expect(card.points).toBeGreaterThanOrEqual(1)
      expect(card.points).toBeLessThanOrEqual(20)
    }
  })

  it('now and then stops just short of a card from the quarter above (CHST-15)', () => {
    const reel = buildReel(OPENING, always(0.1))

    // 14 of 20 is the third quarter; the card after it is from the fourth.
    expect(chestQuarter(reel.cards[reel.winner + 1].points, 20)).toBe(4)
    expect(reel.to - reel.winner).toBeGreaterThan(0.8)
    // Still the opening's own card under the marker.
    expect(reel.cards[reel.winner]).toEqual({ points: 14 })
  })

  it('has no higher card to stop short of from the top quarter', () => {
    const reel = buildReel({ points: 20, jackpot: 20 }, always(0.1))

    expect(reel.to - reel.winner).toBeLessThan(0.9)
  })

  it('has none where the quarter above holds no whole number', () => {
    // A jackpot of 2: 1 is the second quarter, and the third holds nothing.
    const reel = buildReel({ points: 1, jackpot: 2 }, always(0.1))

    expect(reel.to - reel.winner).toBeLessThan(0.9)
  })
})

describe('the ticks', () => {
  it('ticks once for every card edge that crosses the marker, in order, within the run', () => {
    const reel = { from: 4.5, to: 38.5 }
    const ticks = reelTicks(reel, 4400)

    expect(ticks).toHaveLength(34)
    expect(ticks[0]).toBeGreaterThan(0)
    expect(ticks.at(-1)).toBeLessThan(4400)
    for (let index = 1; index < ticks.length; index++) expect(ticks[index]).toBeGreaterThanOrEqual(ticks[index - 1])
  })

  it('comes further apart as the reel slows', () => {
    const ticks = reelTicks({ from: 4.5, to: 38.5 }, 4400)
    const first = ticks[1] - ticks[0]
    const last = ticks[ticks.length - 1] - ticks[ticks.length - 2]

    expect(last).toBeGreaterThan(first * 5)
  })

  it('reads the curve backwards from start to finish', () => {
    expect(reelTimeAt(0)).toBeCloseTo(0, 5)
    expect(reelTimeAt(1)).toBeCloseTo(1, 5)
    // Quick off the mark: half the run is covered in well under half the time.
    expect(reelTimeAt(0.5)).toBeLessThan(0.3)
  })
})
