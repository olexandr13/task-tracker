import { describe, expect, it } from 'vitest'
import { repairMojibake } from './repairMojibake'

/* QUOTE-9 refers to wiki/daily-quote.md. */

describe('repairMojibake', () => {
  it('reads garbled punctuation back as what it was', () => {
    expect(repairMojibake('Meditate â€¦ do not delay, lest you later regret it.')).toBe(
      'Meditate … do not delay, lest you later regret it.',
    )
    expect(repairMojibake('Donâ€™t sacrifice your own welfare')).toBe('Don’t sacrifice your own welfare')
    expect(repairMojibake('â€˜Til your good is better')).toBe('‘Til your good is better')
  })

  it('leaves text that was never garbled alone', () => {
    for (const text of ['Nothing will work unless you do.', 'café', 'Don’t — ever…', 'Ünïcödé', 'Привіт', '']) {
      expect(repairMojibake(text)).toBe(text)
    }
  })

  it('repairs a garbled run beside a character that was always right', () => {
    expect(repairMojibake('Technologyâ€¦ — Max Frisch')).toBe('Technology… — Max Frisch')
  })
})
