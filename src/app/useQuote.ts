import { useEffect, useState } from 'react'
import {
  dayKey,
  ENGLISH_QUOTES,
  languageForDay,
  quoteForDay,
  UKRAINIAN_QUOTES,
  type Quote,
} from '../core'
import type { QuoteRepository } from '../storage/quoteRepository'
import type { QuoteSource } from '../storage/quoteSource'

/**
 * Settles on today's quote.
 *
 * Which language the day landed on decides where it comes from. Ukrainian days
 * are answered from the bundled pack, because no free service hands out
 * Ukrainian quotes. English days ask, in order of preference: the cached quote
 * if it is still today's, then the service, then the bundled English pack.
 *
 * Returns null until it has settled, so the card stays out of the way rather
 * than flashing one quote and swapping it for another.
 */
export function useQuote(source: QuoteSource, repository: QuoteRepository, now: Date): Quote | null {
  const [quote, setQuote] = useState<Quote | null>(null)

  // `now` is a fresh Date on every render, so what this depends on is the *day*
  // it falls in, not the Date itself — otherwise every render would refetch.
  // All three change at local midnight, which is exactly when a new quote is
  // due, and `bundled` comes out of a module-level pack, so it is one stable
  // value for the whole day rather than a new object each time.
  const today = dayKey(now)
  const language = languageForDay(now)
  const bundled = quoteForDay(language === 'uk' ? UKRAINIAN_QUOTES : ENGLISH_QUOTES, now)

  useEffect(() => {
    let cancelled = false

    async function settle(): Promise<void> {
      // A Ukrainian day is already settled: there is nothing to ask. Being
      // derived from the date makes it as steady across a refresh as a cached
      // quote would be, so it needs no cache of its own.
      if (language === 'uk') {
        setQuote(bundled)
        return
      }

      const cached = await repository.load()
      if (cancelled) return

      if (cached !== null && cached.day === today) {
        setQuote(cached.quote)
        return
      }

      const fresh = await source.fetch()
      if (cancelled) return

      setQuote(fresh)
      // Only a quote that came from the service is cached. A bundled one is
      // never written down as today's, so tomorrow's visit — or this one, once
      // there is signal again — goes back to asking.
      await repository.save({ day: today, quote: fresh })
    }

    settle().catch((error: unknown) => {
      // Being offline is an ordinary way for this to end, not a fault: there is
      // a quote to show either way.
      console.warn('Could not reach the quote service; showing a bundled quote.', error)
      if (!cancelled) setQuote(bundled)
    })

    return () => {
      cancelled = true
    }
  }, [source, repository, today, language, bundled])

  return quote
}
