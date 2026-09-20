// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Quote } from '../core'
import type { DailyQuote, QuoteRepository } from '../storage/quoteRepository'
import type { QuoteSource } from '../storage/quoteSource'
import { consoleOutput, expectConsole } from '../test/consoleGuard'
import { useQuote } from './useQuote'

/*
 * Today's quote: where it is asked for and what happens when the service is out
 * of reach. QUOTE ids refer to wiki/daily-quote.md.
 */

const TODAY = new Date(2026, 8, 17, 9, 0)

const CACHED: Quote = { text: 'Nothing will work unless you do.', author: 'Maya Angelou' }
const FETCHED: Quote = { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' }

afterEach(cleanup)

/** A cache and a service the test drives: either can hand a quote over, or fail. */
function setUp({ cached = null, fetchFails = false }: { cached?: DailyQuote | null; fetchFails?: boolean } = {}) {
  const saved: DailyQuote[] = []
  let asked = 0

  const repository: QuoteRepository = {
    load: () => Promise.resolve(cached),
    save: (daily) => {
      saved.push(daily)
      return Promise.resolve()
    },
  }

  const source: QuoteSource = {
    fetch: () => {
      asked += 1
      return fetchFails ? Promise.reject(new Error('Failed to fetch')) : Promise.resolve(FETCHED)
    },
  }

  const hook = renderHook(() => useQuote(source, repository, TODAY))

  return { ...hook, saved, asked: () => asked }
}

describe("today's quote", () => {
  it('shows nothing until it has settled, rather than flashing one quote (QUOTE-11)', () => {
    const { result } = setUp()

    expect(result.current).toBeNull()
  })

  it("takes the cached quote when it is still today's, without asking the service (QUOTE-5)", async () => {
    const { result, asked } = setUp({ cached: { day: '2026-09-17', quote: CACHED } })

    await waitFor(() => {
      expect(result.current).toEqual(CACHED)
    })
    expect(asked()).toBe(0)
  })

  it("asks the service when the cache is another day's, and writes the answer down (QUOTE-1)", async () => {
    const { result, saved } = setUp({ cached: { day: '2026-09-16', quote: CACHED } })

    await waitFor(() => {
      expect(result.current).toEqual(FETCHED)
    })
    expect(saved).toEqual([{ day: '2026-09-17', quote: FETCHED }])
  })

  it('shows no quote at all when the service cannot be reached, and says so once (QUOTE-7)', async () => {
    expectConsole('Could not reach the quote service')
    const { result, saved } = setUp({ fetchFails: true })

    await waitFor(() => {
      expect(consoleOutput()).toHaveLength(1)
    })
    expect(result.current).toBeNull()
    expect(saved).toEqual([])
  })
})
