import { describe, expect, it } from 'vitest'
import type { WarmUpProgress } from '../core'
import { describeHeldBack, describeWarmUpDisable } from './warmUpLabels'

/* What is said when the warm-up holds a habit back. WARM ids refer to wiki/warm-up.md. */

const FULL: WarmUpProgress = { day: 3, daysLeft: 27, allowed: 3, used: 3, remaining: 0, paused: false }

describe('a habit held back', () => {
  it('says tomorrow allows one more (WARM-8)', () => {
    expect(describeHeldBack(FULL)).toBe('Warming up: day 3 allows 3 habits. Tomorrow allows one more.')
  })

  it('says the allowance stays while the warm-up is paused (WARM-11)', () => {
    expect(describeHeldBack({ ...FULL, paused: true })).toBe(
      'Warming up: day 3 allows 3 habits. Paused, so that stays until you resume.',
    )
  })

  it('says the warm-up is over tomorrow on its last day (WARM-8)', () => {
    expect(describeHeldBack({ ...FULL, day: 30, daysLeft: 0, allowed: 30 })).toBe(
      'Warming up: day 30 allows 30 habits. The warm-up is over tomorrow.',
    )
  })
})

describe('turning the warm-up off', () => {
  it('asks, saying the day that would be lost and that enabling it again starts from day 1 (WARM-9)', () => {
    expect(describeWarmUpDisable({ ...FULL, day: 12, daysLeft: 18, allowed: 12 })).toEqual({
      question: 'Disable the warm-up?',
      lines: [
        'Your warm-up is on day 12 of 30.',
        'If you enable it again, it starts from scratch: day 1, with one habit allowed.',
        'Your habits stay as they are.',
      ],
      confirm: 'Disable',
    })
  })

  it('says a paused warm-up is paused (WARM-11)', () => {
    expect(describeWarmUpDisable({ ...FULL, paused: true }).lines[0]).toBe('Your warm-up is paused on day 3 of 30.')
  })
})
