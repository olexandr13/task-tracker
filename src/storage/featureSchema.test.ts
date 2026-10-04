import { describe, expect, it } from 'vitest'
import { ALL_FEATURES_ON } from '../core'
import { FEATURES_SCHEMA_VERSION, readFeatures, toStoredFeatures } from './featureSchema'

/* Reading the switches on Settings back. STORE ids refer to wiki/storage.md. */

describe('the feature switches (STORE-56)', () => {
  it('reads back what was saved, and keeps no record while everything is on', () => {
    expect(readFeatures(toStoredFeatures(['rewards', 'quote']))).toEqual(['rewards', 'quote'])
    expect(toStoredFeatures(ALL_FEATURES_ON)).toBeNull()
  })

  it('reads Cases switched off when it was saved under its earlier name', () => {
    const stored = toStoredFeatures(['quote'])
    expect(readFeatures({ ...stored, off: ['chest', 'quote'] })).toEqual(['cases', 'quote'])
  })

  it('passes over a feature it does not know, keeping the rest', () => {
    const stored = toStoredFeatures(['quote'])
    expect(readFeatures({ ...stored, off: ['weather', 'quote'] })).toEqual(['quote'])
  })

  it('trusts nothing in a version it does not know, or not shaped as switches (STORE-7)', () => {
    const stored = toStoredFeatures(['quote'])

    expect(readFeatures({ ...stored, version: FEATURES_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readFeatures({ ...stored, off: 'quote' })).toBeNull()
    expect(readFeatures(null)).toBeNull()
  })
})
