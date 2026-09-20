import { useEffect, useState } from 'react'
import { toLocalDay, type Quote } from '../core'
import type { QuoteRepository } from '../storage/quoteRepository'
import type { QuoteSource } from '../storage/quoteSource'

/**
 * Settles on today's quote.
 *
 * Asks, in order of preference: the cached quote if it is still today's, then
 * the service. There is no third answer — nothing is bundled with the app — so
 * a day the service cannot be reached on simply has no quote, and the card
 * stays out of the way.
 *
 * Returns null until it has settled, so the card never flashes one quote and
 * swaps it for another.
 */
export function useQuote(source: QuoteSource, repository: QuoteRepository, now: Date): Quote | null {
  const [quote, setQuote] = useState<Quote | null>(null)

  // `now` is a fresh Date on every render, so what this depends on is the *day*
  // it falls in, not the Date itself — otherwise every render would refetch. It
  // changes at local midnight, which is exactly when a new quote is due.
  const today = toLocalDay(now)

  useEffect(() => {
    let cancelled = false

    async function settle(): Promise<void> {
      const cached = await repository.load()
      if (cancelled) return

      if (cached !== null && cached.day === today) {
        setQuote(cached.quote)
        return
      }

      const fresh = await source.fetch()
      if (cancelled) return

      setQuote(fresh)
      // Writing it down is what makes the quote a daily one: the service hands
      // out a random quote, so without this a refresh would re-roll it.
      await repository.save({ day: today, quote: fresh })
    }

    settle().catch((error: unknown) => {
      // Being offline is an ordinary way for this to end, not a fault: the quote
      // is decoration, and the card simply stays hidden until one can be had.
      console.warn('Could not reach the quote service; no quote today.', error)
    })

    return () => {
      cancelled = true
    }
  }, [source, repository, today])

  return quote
}
