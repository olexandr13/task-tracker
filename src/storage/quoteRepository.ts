import type { Quote } from '../core'

/** A quote together with the local day it was today's quote for. */
export interface DailyQuote {
  /** A local day key, as `dayKey` in ../core writes them. */
  readonly day: string
  readonly quote: Quote
}

/**
 * Where today's quote is kept between visits.
 *
 * Caching it is what makes the quote a *daily* one rather than a per-refresh
 * one: the source hands out a random quote, so without somewhere to remember
 * the answer, every reload would bring a different one.
 */
export interface QuoteRepository {
  load(): Promise<DailyQuote | null>
  save(daily: DailyQuote): Promise<void>
}
