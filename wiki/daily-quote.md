# Daily quote

The one thing on screen that is not a task: a quote at the bottom of the rail, below the progress
bars, which changes once a day.

## Which quote

- **QUOTE-1** One quote a day. Which one is **derived from the day**, so a refresh does not re-roll
  it and a page left open across midnight picks the new day up on its next render.
- **QUOTE-2** The day also decides the **language** — English or Ukrainian. It is a coin toss, but
  one derived from the day like everything else, so the same day always gives the same answer;
  it does not simply alternate.
- **QUOTE-3** Walking a pack gives a different quote each day, and the pack is gone all the way
  through before any quote comes round again.

## Where it comes from

- **QUOTE-4** A **Ukrainian** day is answered from the quotes bundled with the app. That pack is
  the only source, not a fallback: no free service hands out Ukrainian quotes.
- **QUOTE-5** An **English** day asks, in order: the quote cached for today, then the quote
  service, then the bundled English pack.
- **QUOTE-6** Only a quote that came from the service is cached. A bundled quote is never written
  down as today's, so the next visit — or this one, once there is signal again — goes back to
  asking.
- **QUOTE-7** Being offline is an ordinary way for this to end, not a fault. A failure, a slow
  answer past 8 seconds, or an answer in an unfamiliar shape all fall back to the bundled pack
  quietly, with only a console warning.
- **QUOTE-8** Quotes are asked for by theme — motivational, inspirational, success — and kept short
  enough not to turn the card into a wall of text.
- **QUOTE-9** Bundled quotes are out of copyright, and both packs lean towards **getting started**
  rather than towards greatness, because getting started is the procrastination this app is for.

## How it shows

- **QUOTE-10** The card shows the quote and its attribution, and nothing else.
- **QUOTE-11** Nothing is shown until today's quote has settled, so the card never flashes one
  quote and swaps it for another.
- **QUOTE-12** The card marks which language it is in, so a screen reader does not read Ukrainian
  with an English voice.

---

**Where it lives:** `src/core/quote.ts` (which quote, which language), `src/core/bundledQuotes.ts`
(the packs), `src/storage/quotableQuoteSource.ts` (the service),
`src/storage/localStorageQuoteRepository.ts` (the cache), `src/app/useQuote.ts`,
`src/app/components/QuoteCard.tsx`.
**Tested in:** `src/core/quote.test.ts`.
