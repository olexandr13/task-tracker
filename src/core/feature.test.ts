import { describe, expect, it } from 'vitest'
import {
  ALL_FEATURES_ON,
  FEATURES,
  featuresOn,
  isFeature,
  isFeatureOn,
  isModeAvailable,
  switchFeature,
} from './feature'

describe('which features are on', () => {
  it('is every one, for an account that never switched one off', () => {
    expect(FEATURES.every((feature) => isFeatureOn(ALL_FEATURES_ON, feature))).toBe(true)
  })

  it('leaves out the ones switched off', () => {
    expect(isFeatureOn(['balance'], 'balance')).toBe(false)
    expect(isFeatureOn(['balance'], 'activity')).toBe(true)
  })

  it('takes a part off with the whole it belongs to (FEAT-4)', () => {
    expect(isFeatureOn(['rewards'], 'cases')).toBe(false)
    expect(isFeatureOn(['tags'], 'balance')).toBe(false)
  })

  it('says so for every feature at once', () => {
    const on = featuresOn(['rewards', 'quote'])
    expect(on.rewards).toBe(false)
    expect(on.cases).toBe(false)
    expect(on.quote).toBe(false)
    expect(on.habits).toBe(true)
  })
})

describe('switching a feature', () => {
  it('turns it off', () => {
    expect(switchFeature(ALL_FEATURES_ON, 'habits', false)).toEqual(['habits'])
  })

  it('turns it back on', () => {
    expect(switchFeature(['habits', 'quote'], 'habits', true)).toEqual(['quote'])
  })

  it('keeps them in the order Settings lists them, whatever order they were switched in', () => {
    expect(switchFeature(['quote'], 'habits', false)).toEqual(['habits', 'quote'])
  })

  it('does not change the features it was given', () => {
    const off = ['quote'] as const
    switchFeature(off, 'habits', false)
    expect(off).toEqual(['quote'])
  })

  it('keeps a part’s own switch while the whole is switched off, so it comes back as it was (FEAT-4)', () => {
    const off = switchFeature(['cases'], 'rewards', false)
    expect(off).toEqual(['rewards', 'cases'])
    expect(isFeatureOn(switchFeature(off, 'rewards', true), 'cases')).toBe(false)
    expect(isFeatureOn(switchFeature(['rewards'], 'rewards', true), 'cases')).toBe(true)
  })
})

describe('whether a mode is there (FEAT-9)', () => {
  it('is, while everything is on', () => {
    expect(isModeAvailable(ALL_FEATURES_ON, 'procrastination')).toBe(true)
    expect(isModeAvailable(ALL_FEATURES_ON, 'checkIn')).toBe(true)
  })

  it('is not, for any of them, with the modes switched off', () => {
    for (const mode of ['procrastination', 'warmUp', 'nudge', 'checkIn'] as const) {
      expect(isModeAvailable(['modes'], mode)).toBe(false)
    }
  })

  it('takes the warm-up away with the habits it lets in', () => {
    expect(isModeAvailable(['habits'], 'warmUp')).toBe(false)
    expect(isModeAvailable(['habits'], 'nudge')).toBe(true)
  })

  it('takes the check-in away with the log it asks to be written in', () => {
    expect(isModeAvailable(['activity'], 'checkIn')).toBe(false)
    expect(isModeAvailable(['activity'], 'procrastination')).toBe(true)
  })
})

describe('telling a feature from anything else', () => {
  it('knows the names there are', () => {
    expect(isFeature('rewards')).toBe(true)
    expect(isFeature('weather')).toBe(false)
    expect(isFeature(3)).toBe(false)
  })
})
