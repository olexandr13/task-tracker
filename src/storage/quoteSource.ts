import type { Quote } from '../core'

/**
 * Where a fresh quote comes from.
 *
 * An interface for the same reason `TaskRepository` is one: every call site
 * talks to this and never to `fetch` directly, so the day this quote service
 * goes the way of its own predecessor, swapping it is a new file here rather
 * than a change in the UI.
 */
export interface QuoteSource {
  /** Rejects if the source can't be reached, is too slow, or answers in an unfamiliar shape. */
  fetch(): Promise<Quote>
}
