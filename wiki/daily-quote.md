# Daily quote

The one thing on screen that is not a task: a quote at the bottom of the rail, below the progress
bars, which changes once a day.

## Which quote

- **QUOTE-1** One quote a day. Today's is settled once and kept for the day, so a refresh does not
  re-roll it, and a page left open across midnight asks for the new day's on its next render.

## Where it comes from

- **QUOTE-5** The quote asks, in order: the quote cached for today, then the quote service.
- **QUOTE-7** Being offline is an ordinary way for this to end, not a fault. A failure, a slow
  answer past 8 seconds, or an answer in an unfamiliar shape all leave the day without a quote
  quietly, with only a console warning — the card stays away rather than showing something else.
- **QUOTE-8** Quotes are asked for by theme — motivational, inspirational, success — and kept short
  enough not to turn the card into a wall of text.

## How it shows

- **QUOTE-10** The card shows the quote and its attribution, and nothing else.
- **QUOTE-11** Nothing is shown until today's quote has settled, so the card never flashes one
  quote and swaps it for another.

---

**Where it lives:** `src/core/quote.ts` (what a quote is),
`src/storage/quotableQuoteSource.ts` (the service), `src/storage/localStorageQuoteRepository.ts`
(the cache), `src/app/useQuote.ts`, `src/app/components/QuoteCard.tsx`.
**Tested in:** `src/app/useQuote.test.ts`.
