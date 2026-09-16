import { describe, expect, it } from 'vitest'
import { ENGLISH_QUOTES, UKRAINIAN_QUOTES } from './bundledQuotes'
import { dayKey, inLanguage, languageForDay, quoteForDay, type QuotePack } from './quote'

// Local dates on purpose: a day is the owner's local day, as everywhere else.
const TUE_15_MORNING = new Date(2026, 8, 15, 9, 0)
const TUE_15_LATE = new Date(2026, 8, 15, 23, 59, 59)
const WED_16 = new Date(2026, 8, 16, 9, 0)

const PACK: QuotePack = inLanguage('en', [
  { text: 'first', author: 'A' },
  { text: 'second', author: 'B' },
  { text: 'third', author: 'C' },
])

/** The run of days starting at `from`, as the app would meet them. */
function days(from: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, offset) => new Date(2026, 8, from.getDate() + offset, 9, 0))
}

describe('dayKey', () => {
  it('writes the local date', () => {
    expect(dayKey(TUE_15_MORNING)).toBe('2026-09-15')
  })

  it('is the same at one minute to midnight as it is in the morning', () => {
    expect(dayKey(TUE_15_LATE)).toBe(dayKey(TUE_15_MORNING))
  })

  it('changes at midnight', () => {
    expect(dayKey(WED_16)).toBe('2026-09-16')
  })

  it('pads a single-digit month and day', () => {
    expect(dayKey(new Date(2026, 0, 3, 12, 0))).toBe('2026-01-03')
  })
})

describe('inLanguage', () => {
  it('stamps every quote in the pack', () => {
    expect(inLanguage('uk', [{ text: 'один', author: 'A' }, { text: 'два', author: 'B' }])).toEqual([
      { text: 'один', author: 'A', language: 'uk' },
      { text: 'два', author: 'B', language: 'uk' },
    ])
  })
})

describe('languageForDay', () => {
  it('gives the same answer all day, so a refresh cannot change the language', () => {
    expect(languageForDay(TUE_15_LATE)).toBe(languageForDay(TUE_15_MORNING))
  })

  it('uses both languages over a year', () => {
    const languages = days(TUE_15_MORNING, 365).map(languageForDay)

    expect(languages.filter((language) => language === 'uk').length).toBeGreaterThan(100)
    expect(languages.filter((language) => language === 'en').length).toBeGreaterThan(100)
  })

  it('tosses a coin rather than taking turns', () => {
    const languages = days(TUE_15_MORNING, 60).map(languageForDay)
    const repeats = languages.filter((language, index) => index > 0 && language === languages[index - 1])

    expect(repeats.length).toBeGreaterThan(0)
  })
})

describe('quoteForDay', () => {
  it('gives the same quote all day, so a refresh does not re-roll it', () => {
    expect(quoteForDay(PACK, TUE_15_LATE)).toEqual(quoteForDay(PACK, TUE_15_MORNING))
  })

  it('moves on when the day does', () => {
    expect(quoteForDay(PACK, WED_16)).not.toEqual(quoteForDay(PACK, TUE_15_MORNING))
  })

  it('works through the whole pack before repeating one', () => {
    const run = days(TUE_15_MORNING, PACK.length).map((day) => quoteForDay(PACK, day))

    expect(new Set(run.map((quote) => quote.text)).size).toBe(PACK.length)
  })

  it('wraps round to the start once the pack has run out', () => {
    const afterOneRound = new Date(2026, 8, 15 + PACK.length, 9, 0)

    expect(quoteForDay(PACK, afterOneRound)).toEqual(quoteForDay(PACK, TUE_15_MORNING))
  })

  it('stays inside the pack for a day before 1970, where the day count runs negative', () => {
    expect(PACK).toContain(quoteForDay(PACK, new Date(1969, 4, 20, 9, 0)))
  })
})

describe.each([
  ['English', ENGLISH_QUOTES, 'en'],
  ['Ukrainian', UKRAINIAN_QUOTES, 'uk'],
] as const)('the bundled %s pack', (_name, pack, language) => {
  it('is never empty, so there is always something to fall back on', () => {
    expect(pack.length).toBeGreaterThan(0)
  })

  it('has a text and an author for every quote', () => {
    for (const quote of pack) {
      expect(quote.text.trim()).not.toBe('')
      expect(quote.author.trim()).not.toBe('')
    }
  })

  it('knows the language it is written in', () => {
    for (const quote of pack) {
      expect(quote.language).toBe(language)
    }
  })

  it('says each thing once, so a repeat means the pack has gone all the way round', () => {
    const texts = pack.map((quote) => quote.text)

    expect(new Set(texts).size).toBe(texts.length)
  })
})
