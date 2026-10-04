import { describe, expect, it } from 'vitest'
import type { CaseWorking } from '../core'
import { describeCaseWorking, describeNextCase } from './caseLabels'

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

describe('how a case’s range is worked out (CHST-22)', () => {
  it('says Payday from the cheapest task up to half of today', () => {
    const working: CaseWorking = { source: 'today', cheapest: 4, earned: 41, half: 20, span: { least: 4, most: 20 } }

    expect(describeCaseWorking(working)).toBe(
      'The cheapest task finished today is 4 points. Everything earned today is 41 points, so half is 20 points. Payday pays 4 to 20 points.',
    )
  })

  it('says Payday pays the cheapest task when half of today is less', () => {
    const working: CaseWorking = { source: 'today', cheapest: 9, earned: 9, half: 4, span: { least: 9, most: 9 } }

    expect(describeCaseWorking(working)).toBe(
      'The cheapest task finished today is 9 points. Everything earned today is 9 points, so half is 4 points, which is less than that task. Payday pays 9 points.',
    )
  })

  it('says Payday pays 1 point when today has earned nothing', () => {
    const working: CaseWorking = { source: 'today', cheapest: null, earned: 0, half: 0, span: { least: 1, most: 1 } }

    expect(describeCaseWorking(working)).toBe('No task has been finished today, and nothing has been earned yet. Payday pays 1 point.')
  })

  it('says Payday from 1 up to half of a bonus when today has no task', () => {
    const working: CaseWorking = { source: 'today', cheapest: null, earned: 5, half: 2, span: { least: 1, most: 2 } }

    expect(describeCaseWorking(working)).toBe(
      'No task has been finished today. Everything earned today is 5 points, so half is 2 points. Payday pays 1 to 2 points.',
    )
  })

  it('says the Drop from yesterday divided by yesterday’s tasks', () => {
    const working: CaseWorking = { source: 'daily', earned: 37, tasks: 2, share: 18, span: { least: 1, most: 18 } }

    expect(describeCaseWorking(working)).toBe(
      'Yesterday earned 37 points across 2 tasks, which comes to 18 points. The Drop pays 1 to 18 points.',
    )
  })

  it('says the Drop pays 1 point when yesterday had no tasks', () => {
    const working: CaseWorking = { source: 'daily', earned: 0, tasks: 0, share: 0, span: { least: 1, most: 1 } }

    expect(describeCaseWorking(working)).toBe('Yesterday had no tasks. The Drop pays 1 point.')
  })

  it('says Weekly from the cheapest task last week up to that week divided by its tasks', () => {
    const working: CaseWorking = {
      source: 'week',
      cheapest: 4,
      earned: 28,
      tasks: 3,
      share: 9,
      span: { least: 4, most: 9 },
    }

    expect(describeCaseWorking(working)).toBe(
      'The cheapest task finished last week is 4 points. Last week earned 28 points across 3 tasks, which comes to 9 points. Weekly pays 4 to 9 points.',
    )
  })

  it('says Weekly pays exactly those points when the average meets the cheapest task', () => {
    const working: CaseWorking = { source: 'week', cheapest: 5, earned: 11, tasks: 2, share: 5, span: { least: 5, most: 5 } }

    expect(describeCaseWorking(working)).toBe(
      'The cheapest task finished last week is 5 points. Last week earned 11 points across 2 tasks, which comes to 5 points. Weekly pays 5 points.',
    )
  })

  it('says Weekly pays the cheapest task when the average falls short of it', () => {
    const working: CaseWorking = { source: 'week', cheapest: 8, earned: 10, tasks: 2, share: 5, span: { least: 8, most: 8 } }

    expect(describeCaseWorking(working)).toBe(
      'The cheapest task finished last week is 8 points. Last week earned 10 points across 2 tasks, which comes to 5 points, which is less than that task. Weekly pays 8 points.',
    )
  })

  it('says Weekly pays 1 point when last week had no tasks', () => {
    const working: CaseWorking = { source: 'week', cheapest: null, earned: 0, tasks: 0, share: 0, span: { least: 1, most: 1 } }

    expect(describeCaseWorking(working)).toBe('Last week had no tasks. Weekly pays 1 point.')
  })
})
