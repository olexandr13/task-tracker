/**
 * Which quote belongs to a given day.
 *
 * The quote is the one thing on screen that isn't a task, and it changes once a
 * day. Which one shows is *derived* from the date, the same way a repeating
 * task's occurrence is: nothing runs at midnight to swap it, and a page left
 * open across midnight picks the new day up on its next render.
 *
 * Days are local days, matching ./repeat — the owner's today, not UTC's.
 */

export type Language = 'en' | 'uk'

export interface Quote {
  readonly text: string
  /** Attribution as the source gives it. */
  readonly author: string
  /**
   * Which language `text` is in. Carried on the quote rather than worked out
   * from it, so the page can mark it up for a screen reader — read Ukrainian
   * with an English voice and it comes out as noise.
   */
  readonly language: Language
}

/** A quote before it knows its language: how the bundled packs are written out. */
export type QuoteText = Omit<Quote, 'language'>

/**
 * At least one quote, so that asking a pack for a day can't come back
 * empty-handed. The type carries the guarantee, so there is no empty case to
 * handle at every call site.
 */
export type QuotePack = readonly [Quote, ...Quote[]]

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * A local day as a key: `2026-09-15`. A cached quote stores the day it was
 * chosen for, and comparing two of these is the whole of "is it still today's?".
 */
export function dayKey(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Whole local days since the epoch.
 *
 * Built from the local year/month/day through `Date.UTC` rather than by
 * dividing the timestamp: a local day either side of a daylight saving change
 * is 23 or 25 hours long, and dividing would drift a day every time the clocks
 * went back.
 */
function dayNumber(now: Date): number {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY)
}

/**
 * The pack's quote for the day `now` falls in.
 *
 * Walks the pack one quote per day and wraps round at the end. The same day
 * always gives the same quote, so a refresh doesn't re-roll it, and consecutive
 * days never repeat until the pack has been all the way round.
 */
/**
 * Stamps a whole pack with the language it is written in, so the data can be a
 * plain list of text and author instead of repeating itself on every line.
 *
 * Destructured rather than mapped over, because that is what carries the
 * "at least one" through to the result without an assertion.
 */
export function inLanguage(language: Language, [first, ...rest]: readonly [QuoteText, ...QuoteText[]]): QuotePack {
  return [{ ...first, language }, ...rest.map((quote) => ({ ...quote, language }))]
}

/**
 * Which language today's quote is in.
 *
 * A coin toss, but one *derived from the day* like everything else here: the
 * same day always gives the same answer, so a refresh can't turn a Ukrainian
 * day into an English one. Scrambled rather than taken straight from the day
 * count, because `day % 2` would simply alternate, and alternating is a rota
 * rather than a toss.
 */
export function languageForDay(now: Date = new Date()): Language {
  return scramble(dayNumber(now)) % 2 === 0 ? 'uk' : 'en'
}

/**
 * Mixes the day count so that the bit read off the end of it doesn't inherit
 * the day's own parity — a plain shift-and-xor leaves the lowest bit following
 * the day almost exactly, which comes out as English, Ukrainian, English,
 * Ukrainian: a rota rather than a toss. Two rounds of multiply-and-fold spread
 * every input bit across the result instead.
 */
function scramble(day: number): number {
  let x = day | 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)

  return (x ^ (x >>> 16)) >>> 0
}

export function quoteForDay(pack: QuotePack, now: Date = new Date()): Quote {
  // Two remainders: the first can be negative for a day before 1970, and a
  // negative index would read straight off the end of the pack.
  const index = ((dayNumber(now) % pack.length) + pack.length) % pack.length

  return pack[index]
}
