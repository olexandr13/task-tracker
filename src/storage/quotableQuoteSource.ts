import type { Quote } from '../core'
import type { QuoteSource } from './quoteSource'

/**
 * Quotes from the community-run Quotable mirror.
 *
 * Free, no API key, and — the part that actually decides it — it answers with
 * `Access-Control-Allow-Origin: *`, so a static page with no backend of its own
 * can call it. ZenQuotes can't be used this way: it only sends CORS headers for
 * a registered key, which a client-side app would have to ship in public.
 */
const ENDPOINT = 'https://api.quotable.kurokeita.dev/api/quotes/random'

/**
 * Capitalised on purpose. The API matches tag names exactly and answers an
 * unrecognised one with an empty object and a 200, so a lower-case tag fails
 * silently rather than loudly.
 */
const TAGS = 'Motivational|Inspirational|Success'

/** Long quotes turn the card into a wall of text; this keeps them to a few lines. */
const MAX_LENGTH = 130

/** A quote is decoration: better to end up with none than to hang on a dead socket. */
const TIMEOUT_MS = 8000

interface QuotableResponse {
  readonly quote: {
    readonly content: string
    readonly author: { readonly name: string }
  }
}

/**
 * The empty-object answer above means a 200 is not enough to go on, so the
 * shape is checked before anything is read out of it.
 */
function isQuotableResponse(body: unknown): body is QuotableResponse {
  if (typeof body !== 'object' || body === null || !('quote' in body)) {
    return false
  }

  const { quote } = body as { quote: unknown }
  if (typeof quote !== 'object' || quote === null || !('content' in quote) || !('author' in quote)) {
    return false
  }

  const { content, author } = quote as { content: unknown; author: unknown }

  return (
    typeof content === 'string' &&
    content.length > 0 &&
    typeof author === 'object' &&
    author !== null &&
    'name' in author &&
    typeof (author as { name: unknown }).name === 'string'
  )
}

export const quotableQuoteSource: QuoteSource = {
  async fetch(): Promise<Quote> {
    const url = new URL(ENDPOINT)
    url.searchParams.set('tags', TAGS)
    url.searchParams.set('maxLength', String(MAX_LENGTH))

    // Qualified, so that naming this method `fetch` doesn't call it on itself.
    const response = await globalThis.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`The quote service answered ${String(response.status)}.`)
    }

    const body: unknown = await response.json()
    if (!isQuotableResponse(body)) {
      throw new Error('The quote service answered in a shape this app does not know.')
    }

    return { text: body.quote.content, author: body.quote.author.name }
  },
}
