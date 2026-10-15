import { describe, expect, it } from 'vitest'
import { createGoal } from '../core'
import { GOAL_SCHEMA_VERSION, readGoal, toStoredGoal } from './goalSchema'

const NOW = new Date('2026-10-15T10:00:00.000Z')

describe('reading a saved goal (STORE-1)', () => {
  const fit = { ...createGoal('Get fit', NOW), order: 1024 }

  it('reads back what it wrote', () => {
    expect(readGoal(toStoredGoal(fit))).toEqual(fit)
  })

  it('refuses a version it does not know: a shape it cannot be sure of is left unread', () => {
    expect(readGoal({ version: GOAL_SCHEMA_VERSION + 1, goal: fit })).toBe(null)
    expect(readGoal({ goal: fit })).toBe(null)
  })

  it('refuses anything that is not a saved goal at all', () => {
    expect(readGoal(null)).toBe(null)
    expect(readGoal('Get fit')).toBe(null)
    expect(readGoal({ version: GOAL_SCHEMA_VERSION })).toBe(null)
  })

  it('refuses a goal whose fields are not what they should be', () => {
    const broken: unknown[] = [
      { ...fit, id: '' },
      { ...fit, name: '   ' },
      { ...fit, name: 42 },
      { ...fit, createdAt: 'the other day' },
      { ...fit, order: Number.NaN },
    ]

    for (const goal of broken) {
      expect(readGoal({ version: GOAL_SCHEMA_VERSION, goal })).toBe(null)
    }
  })
})
