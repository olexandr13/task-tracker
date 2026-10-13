import { describe, expect, it } from 'vitest'
import type { XpProgress } from '../core'
import {
  migrateLegacyXp,
  readLegacyXpDay,
  readLegacyXpRecord,
  readLegacyXpStart,
  readXpProgress,
  toStoredXpProgress,
  XP_SCHEMA_VERSION,
} from './xpSchema'

/* The saved shape of where XP stands. STORE ids refer to wiki/storage.md. */

const PROGRESS: XpProgress = { xp: -12, startedOn: '2026-10-01', settledThrough: '2026-10-02', addsOn: '2026-10-03', adds: 4 }

describe('where XP stands (STORE-64)', () => {
  it('is one record, named for itself, and reads back the same', () => {
    expect(toStoredXpProgress(PROGRESS)).toEqual({ version: XP_SCHEMA_VERSION, name: 'progress', ...PROGRESS })
    expect(readXpProgress(toStoredXpProgress(PROGRESS))).toEqual(PROGRESS)
  })

  it('reads a record without the day’s adds as none added yet', () => {
    expect(readXpProgress({ version: XP_SCHEMA_VERSION, name: 'progress', xp: 5, startedOn: '2026-10-01' })).toEqual({
      xp: 5,
      startedOn: '2026-10-01',
      settledThrough: null,
      addsOn: null,
      adds: 0,
    })
  })

  it('cannot be trusted with an unknown version, an amount that is not whole, or a day that is not one (STORE-7)', () => {
    const stored = toStoredXpProgress(PROGRESS)
    expect(readXpProgress({ ...stored, version: XP_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readXpProgress({ ...stored, xp: 1.5 })).toBeNull()
    expect(readXpProgress({ ...stored, startedOn: 'someday' })).toBeNull()
    expect(readXpProgress({ ...stored, adds: -1 })).toBeNull()
  })
})

describe('XP as version 1 kept it (STORE-5)', () => {
  it('moves into where XP stands: its records from the day it began added up, the history let go of', () => {
    const start = readLegacyXpStart({ version: 1, name: 'start', startedOn: '2026-10-02', settledThrough: null })
    expect(start).toEqual({ startedOn: '2026-10-02', settledThrough: null })

    const records = [
      ...readLegacyXpDay({ version: 1, day: '2026-10-01', records: { 'add:a': { kind: 'add', xp: 1, subject: '', at: '' } } }),
      ...readLegacyXpDay({
        version: 1,
        day: '2026-10-02',
        records: { 'done:a:2026-10-02': { kind: 'done', xp: 4 }, 'skip:b:2026-10-02': { kind: 'skip', xp: -3 } },
      }),
    ]
    expect(migrateLegacyXp(start ?? { startedOn: '', settledThrough: null }, records)).toEqual({
      xp: 1,
      startedOn: '2026-10-02',
      settledThrough: null,
      addsOn: null,
      adds: 0,
    })
  })

  it('reads a guest’s record, and nothing from what cannot be read', () => {
    expect(readLegacyXpRecord({ version: 1, record: { key: 'add:a', day: '2026-10-02', xp: 1 } })).toEqual({ day: '2026-10-02', xp: 1 })
    expect(readLegacyXpRecord({ version: 2, record: { day: '2026-10-02', xp: 1 } })).toBeNull()
    expect(readLegacyXpDay({ version: 1, day: 'someday', records: {} })).toEqual([])
  })
})
