/**
 * What a quote is.
 *
 * The quote is the one thing on screen that isn't a task, and it changes once a
 * day. Where it comes from is storage's business (`src/storage/quoteSource.ts`),
 * and which day it belongs to is written with `toLocalDay` from ./day, the same
 * local-day key everything else here uses. All that is left for the rules is the
 * shape of the thing itself.
 */

export interface Quote {
  readonly text: string
  /** Attribution as the source gives it. */
  readonly author: string
}
