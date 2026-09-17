import { describe, expect, it } from 'vitest'
import type { Redemption } from '../core'
import { readRedemption, readRewardDay, REWARD_SCHEMA_VERSION, toStoredRedemption } from './rewardSchema'

/* Reading the points ledger back. STORE ids refer to wiki/storage.md. */

const REDEMPTION: Redemption = {
  id: '4b1c6f0e-8f5e-4a53-9a1e-2f7d0c1b9e11',
  points: 3,
  note: 'coffee',
  redeemedAt: '2026-09-17T12:00:00.000Z',
}

describe('readRewardDay (STORE-21, STORE-24)', () => {
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

  it('trusts nothing in a version it does not know, or not shaped as a day (STORE-24)', () => {
    const day = { version: REWARD_SCHEMA_VERSION, day: '2026-09-17', entries: { run: { points: 2 } } }

    expect(readRewardDay({ ...day, version: 99 })).toBeNull()
    expect(readRewardDay({ ...day, day: '2026-02-30' })).toBeNull()
    expect(readRewardDay({ ...day, entries: [] })).toBeNull()
    expect(readRewardDay({ ...day, entries: { run: { points: 0 } } })).toBeNull()
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
