import type { DailyQuote, QuoteRepository } from './quoteRepository'

const STORAGE_KEY = 'task-tracker/quote'

/**
 * Bump this whenever the saved shape changes, and migrate on load — same rule
 * as the tasks. Kept under its own key and its own version, because a quote and
 * a task list have no reason to change shape together.
 */
const SCHEMA_VERSION = 3

interface StoredQuote {
  version: number
  daily: unknown
}

/** Returns the cached quote in today's shape, or null if the data can't be trusted. */
function migrate(stored: StoredQuote): DailyQuote | null {
  // Nothing older is migrated — version 2 and before carried the language a
  // quote was written in, from when there were Ukrainian days. A cached quote is
  // a day old at most and the service can simply be asked again, so there is
  // nothing here worth carrying forward.
  if (stored.version !== SCHEMA_VERSION) {
    return null
  }

  const { daily } = stored
  if (typeof daily !== 'object' || daily === null) {
    return null
  }

  const { day, quote } = daily as { day: unknown; quote: unknown }
  if (typeof day !== 'string' || typeof quote !== 'object' || quote === null) {
    return null
  }

  const { text, author } = quote as { text: unknown; author: unknown }
  if (typeof text !== 'string' || typeof author !== 'string') {
    return null
  }

  return { day, quote: { text, author } }
}

export const localStorageQuoteRepository: QuoteRepository = {
  load(): Promise<DailyQuote | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // A cached quote is worth nothing once it can't be read: there is no
      // history to lose, so anything unexpected is simply dropped and refetched.
      return Promise.resolve(raw === null ? null : migrate(JSON.parse(raw) as StoredQuote))
    } catch {
      return Promise.resolve(null)
    }
  },

  save(daily: DailyQuote): Promise<void> {
    const stored: StoredQuote = { version: SCHEMA_VERSION, daily }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // Today's quote is on screen already; tomorrow's open simply asks again.
    }
    return Promise.resolve()
  },
}
