// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { localStorageQuoteRepository } from './localStorageQuoteRepository'

/* QUOTE-1 and QUOTE-9 refer to wiki/daily-quote.md. */

const KEY = 'task-tracker/quote'

afterEach(() => {
  localStorage.removeItem(KEY)
})

describe('localStorageQuoteRepository', () => {
  it('keeps the day and quote across a load after save', async () => {
    const daily = { day: '2026-10-07', quote: { text: 'Nothing will work unless you do.', author: 'Maya Angelou' } }
    await localStorageQuoteRepository.save(daily)
    expect(await localStorageQuoteRepository.load()).toEqual(daily)
  })

  it('repairs a garbled quote cached before repairs were made', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 3,
        daily: { day: '2026-10-07', quote: { text: 'Meditate â€¦ do not delay.', author: 'The Buddha' } },
      }),
    )
    expect(await localStorageQuoteRepository.load()).toEqual({
      day: '2026-10-07',
      quote: { text: 'Meditate … do not delay.', author: 'The Buddha' },
    })
  })

  it('drops versions it does not know and anything it cannot read', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, daily: { day: '2026-10-07', quote: { text: 'a', author: 'b' } } }))
    expect(await localStorageQuoteRepository.load()).toBeNull()
    localStorage.setItem(KEY, '{not json')
    expect(await localStorageQuoteRepository.load()).toBeNull()
  })
})
