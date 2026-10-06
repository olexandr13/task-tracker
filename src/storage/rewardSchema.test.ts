import { describe, expect, it } from 'vitest'
import { createPointValue, DEFAULT_CASES, type CaseSettings, type Redemption } from '../core'
import {
  readCaseSettings,
  readRedemption,
  readRewardDay,
  readPointValue,
  readRewardGoal,
  REWARD_SCHEMA_VERSION,
  toStoredCaseSettings,
  toStoredPointValue,
  toStoredRedemption,
  toStoredRewardGoal,
} from './rewardSchema'

/* Reading the points ledger back. STORE ids refer to wiki/storage.md. */

const REDEMPTION: Redemption = {
  id: '4b1c6f0e-8f5e-4a53-9a1e-2f7d0c1b9e11',
  points: 3,
  note: 'coffee',
  redeemedAt: '2026-09-17T12:00:00.000Z',
}

describe('readRewardDay (STORE-21, STORE-24)', () => {
  it('reads an opening written as 0, rather than losing the day (STORE-21)', () => {
    const data = { version: REWARD_SCHEMA_VERSION, day: '2026-09-17', entries: { 'chest-open': { points: 0 } } }
    expect(readRewardDay(data)).toEqual([{ taskId: 'chest-open', day: '2026-09-17', points: 0 }])
  })

  it('reads an entry per task done on the day', () => {
    const data = { version: REWARD_SCHEMA_VERSION, day: '2026-09-17', entries: { run: { points: 2 }, read: { points: 5 } } }

    expect(readRewardDay(data)).toEqual([
      { taskId: 'run', day: '2026-09-17', points: 2 },
      { taskId: 'read', day: '2026-09-17', points: 5 },
    ])
  })

  it('reads a day whose every entry was taken back as none', () => {
    expect(readRewardDay({ version: REWARD_SCHEMA_VERSION, day: '2026-09-17', entries: {} })).toEqual([])
  })

  it('reads a day left with no entries at all as none, rather than as unreadable (STORE-22)', () => {
    // Taking back the last of a day deletes the last field of its map, and the
    // database drops an empty map: what is left is the version and the day.
    expect(readRewardDay({ version: REWARD_SCHEMA_VERSION, day: '2026-09-17' })).toEqual([])
  })

  it('trusts nothing in a version it does not know, or not shaped as a day (STORE-24)', () => {
    const day = { version: REWARD_SCHEMA_VERSION, day: '2026-09-17', entries: { run: { points: 2 } } }

    expect(readRewardDay({ ...day, version: 99 })).toBeNull()
    expect(readRewardDay({ ...day, day: '2026-02-30' })).toBeNull()
    expect(readRewardDay({ ...day, entries: [] })).toBeNull()
    expect(readRewardDay({ ...day, entries: { run: { points: -1 } } })).toBeNull()
    expect(readRewardDay({ ...day, entries: { run: { points: 1.5 } } })).toBeNull()
    expect(readRewardDay({ ...day, entries: { run: 2 } })).toBeNull()
    expect(readRewardDay(null)).toBeNull()
  })
})

describe('readRedemption (STORE-23, STORE-24)', () => {
  it('reads back what was saved', () => {
    expect(readRedemption(toStoredRedemption(REDEMPTION))).toEqual(REDEMPTION)
  })

  it('trusts nothing in a version it does not know, or not shaped as a redemption (STORE-24)', () => {
    expect(readRedemption({ version: 99, redemption: REDEMPTION })).toBeNull()
    expect(readRedemption({ version: REWARD_SCHEMA_VERSION, redemption: { ...REDEMPTION, points: -1 } })).toBeNull()
    expect(readRedemption({ version: REWARD_SCHEMA_VERSION, redemption: { ...REDEMPTION, note: 7 } })).toBeNull()
    expect(readRedemption({ version: REWARD_SCHEMA_VERSION, redemption: { ...REDEMPTION, redeemedAt: 'soon' } })).toBeNull()
    expect(readRedemption({ version: REWARD_SCHEMA_VERSION })).toBeNull()
  })
})

describe('readRewardGoal (STORE-41, STORE-24)', () => {
  it('reads back what clearing each period is worth', () => {
    expect(readRewardGoal(toStoredRewardGoal('today', 10))).toEqual({ period: 'today', points: 10 })
    expect(readRewardGoal(toStoredRewardGoal('week', 40))).toEqual({ period: 'week', points: 40 })
    expect(readRewardGoal(toStoredRewardGoal('month', 100))).toEqual({ period: 'month', points: 100 })
  })

  it('trusts nothing in a version it does not know, or not shaped as a goal (STORE-24)', () => {
    expect(readRewardGoal({ version: 99, goal: { period: 'today', points: 10 } })).toBeNull()
    expect(readRewardGoal({ version: REWARD_SCHEMA_VERSION, goal: { period: 'year', points: 10 } })).toBeNull()
    expect(readRewardGoal({ version: REWARD_SCHEMA_VERSION, goal: { period: 'today', points: 0 } })).toBeNull()
    expect(readRewardGoal({ version: REWARD_SCHEMA_VERSION, goal: { period: 'today', points: 1000 } })).toBeNull()
    expect(readRewardGoal({ version: REWARD_SCHEMA_VERSION })).toBeNull()
    expect(readRewardGoal(null)).toBeNull()
  })
})

describe('readPointValue (STORE-42, STORE-24)', () => {
  it('reads back what a point is worth', () => {
    const value = createPointValue(2.5, 'UAH')

    expect(readPointValue(toStoredPointValue(value))).toEqual(value)
  })

  it('trusts nothing in a version it does not know, or not shaped as a value (STORE-24)', () => {
    const saved = toStoredPointValue(createPointValue(2.5))

    expect(readPointValue({ ...saved, version: 99 })).toBeNull()
    expect(readPointValue({ ...saved, name: 'something else' })).toBeNull()
    expect(readPointValue({ ...saved, value: { amount: 0, currency: 'UAH' } })).toBeNull()
    expect(readPointValue({ ...saved, value: { amount: 2.5, currency: '' } })).toBeNull()
    expect(readPointValue({ ...saved, value: { amount: '2.5', currency: 'UAH' } })).toBeNull()
    expect(readPointValue(null)).toBeNull()
  })
})

describe('readCaseSettings (STORE-48, STORE-24)', () => {
  it('reads back what Cases asks of a day, and whether it counts tasks without points', () => {
    const asking: CaseSettings = { leastTasks: 4, countUnpaid: false }

    expect(readCaseSettings(toStoredCaseSettings(asking))).toEqual(asking)
    expect(readCaseSettings(toStoredCaseSettings(DEFAULT_CASES))).toEqual(DEFAULT_CASES)
  })

  it('reads settings saved with the old choice of jackpot, keeping how big a day must be', () => {
    const saved = { ...toStoredCaseSettings(DEFAULT_CASES), settings: { leastTasks: 4, jackpot: 'typicalDay' } }

    expect(readCaseSettings(saved)).toEqual({ leastTasks: 4, countUnpaid: true })
  })

  it('reads settings saved before tasks without points could be left out as counting them (CHST-32)', () => {
    const saved = { ...toStoredCaseSettings(DEFAULT_CASES), settings: { leastTasks: 4 } }

    expect(readCaseSettings(saved)).toEqual({ leastTasks: 4, countUnpaid: true })
  })

  it('saves no choice of jackpot, there being none', () => {
    expect(toStoredCaseSettings({ leastTasks: 4, countUnpaid: false }).settings).toEqual({
      leastTasks: 4,
      countUnpaid: false,
    })
  })

  it('trusts nothing in a version it does not know, or not shaped as settings (STORE-24)', () => {
    const saved = toStoredCaseSettings({ leastTasks: 4, countUnpaid: true })

    expect(readCaseSettings({ ...saved, version: 99 })).toBeNull()
    expect(readCaseSettings({ ...saved, name: 'pointValue' })).toBeNull()
    expect(readCaseSettings({ ...saved, settings: { leastTasks: 0 } })).toBeNull()
    expect(readCaseSettings({ ...saved, settings: { leastTasks: '4' } })).toBeNull()
    expect(readCaseSettings({ ...saved, settings: { leastTasks: 4, countUnpaid: 'no' } })).toBeNull()
    expect(readCaseSettings({ ...saved, settings: {} })).toBeNull()
    expect(readCaseSettings(null)).toBeNull()
  })
})
