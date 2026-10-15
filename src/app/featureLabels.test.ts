import { describe, expect, it } from 'vitest'
import { FEATURE_PARENT, FEATURES } from '../core'
import { FEATURE_GROUPS } from './featureLabels'

/* How Settings groups the switches. FEAT ids refer to wiki/features.md. */

describe('the groups of switches (FEAT-11)', () => {
  const grouped = FEATURE_GROUPS.flatMap((group) => group.features)

  it('holds every feature, each once', () => {
    expect([...grouped].sort()).toEqual([...FEATURES].sort())
  })

  it('puts a part right after what it is part of, in the same group (FEAT-4)', () => {
    for (const group of FEATURE_GROUPS) {
      group.features.forEach((feature, index) => {
        const parent = FEATURE_PARENT[feature]
        if (parent === undefined) return
        const before = group.features.slice(0, index).reverse()
        // Only other parts of the same whole may come between them.
        expect(before.find((other) => FEATURE_PARENT[other] !== parent)).toBe(parent)
      })
    }
  })
})
