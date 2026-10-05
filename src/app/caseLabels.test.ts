import { describe, expect, it } from 'vitest'
import { describeNextCase } from './caseLabels'

/* What an opened case says about the next one. CHST ids refer to wiki/cases.md. */

describe('the next case (CHST-28)', () => {
  it('says the next Payday comes tomorrow once every planned task is done', () => {
    expect(describeNextCase('today')).toBe('Take the next one tomorrow after completing all planned tasks.')
  })

  it('says a new Drop is given tomorrow, without the time, and that earning more today raises it', () => {
    expect(describeNextCase('daily')).toBe('A new case will be given tomorrow. Earn more points today to increase reward.')
  })

  it('says a new Weekly is given next Monday (CHST-30)', () => {
    expect(describeNextCase('week')).toBe('A new case will be given next Monday.')
  })
})
