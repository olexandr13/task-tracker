import { describe, expect, it } from 'vitest'
import { createActivityEntry } from '../core'
import { activityChangesBetween } from './activityRepository'
import {
  ACTIVITY_SCHEMA_VERSION,
  readActivityDay,
  readActivityEntry,
  toStoredActivityDays,
  toStoredActivityEntry,
} from './activitySchema'

/* Reading the activity log back. STORE ids refer to wiki/storage.md. */

const AT = new Date('2026-10-02T12:00:00.000Z')
const READING = createActivityEntry('Reading', 900, { day: '2026-10-02', hour: 14 }, AT)
const WORK = createActivityEntry('Work', 2700, { day: '2026-10-02', hour: 9 }, AT)
const CALL = createActivityEntry('Call', 1800, { day: '2026-10-01', hour: 16 }, AT)

describe('a day of the log (STORE-51)', () => {
  it('keeps a document per day, a field per record, and reads them back', () => {
    const days = toStoredActivityDays([READING, CALL, WORK])

    expect(days.map((day) => day.day)).toEqual(['2026-10-01', '2026-10-02'])
    expect(days[1].entries[READING.id]).toEqual({ activity: 'Reading', seconds: 900, hour: 14, loggedAt: AT.toISOString() })
    expect(days.flatMap((day) => readActivityDay(day) ?? [])).toEqual([CALL, READING, WORK])
  })

  it('reads a day whose last record was taken out as one with nothing logged', () => {
    expect(readActivityDay({ version: ACTIVITY_SCHEMA_VERSION, day: '2026-10-02' })).toEqual([])
  })

  it('trusts nothing in a version it does not know, or not shaped as a day of records (STORE-7)', () => {
    const fields = { activity: 'Work', seconds: 60, hour: 9, loggedAt: AT.toISOString() }
    const day = (entries: unknown) => ({ version: ACTIVITY_SCHEMA_VERSION, day: '2026-10-02', entries })

    expect(readActivityDay({ ...day({ a: fields }), version: 99 })).toBeNull()
    expect(readActivityDay({ ...day({ a: fields }), day: 'someday' })).toBeNull()
    expect(readActivityDay(day([fields]))).toBeNull()
    expect(readActivityDay(day({ a: { ...fields, activity: ' ' } }))).toBeNull()
    expect(readActivityDay(day({ a: { ...fields, seconds: 0 } }))).toBeNull()
    expect(readActivityDay(day({ a: { ...fields, hour: 24 } }))).toBeNull()
    expect(readActivityDay(day({ a: { ...fields, loggedAt: 'later' } }))).toBeNull()
    expect(readActivityDay(day({ a: fields }))).toEqual([{ id: 'a', day: '2026-10-02', ...fields }])
    expect(readActivityDay(null)).toBeNull()
  })
})

describe('a record kept on its own, as a guest (STORE-37)', () => {
  it('reads back what was saved, and nothing it cannot trust', () => {
    expect(readActivityEntry(toStoredActivityEntry(READING))).toEqual(READING)
    expect(readActivityEntry({ version: 99, entry: READING })).toBeNull()
    expect(readActivityEntry({ version: ACTIVITY_SCHEMA_VERSION, entry: { ...READING, day: 'someday' } })).toBeNull()
    expect(readActivityEntry({ version: ACTIVITY_SCHEMA_VERSION, entry: { ...READING, id: '' } })).toBeNull()
  })
})

describe('what a change writes (STORE-51)', () => {
  it('saves only the records it changed, and takes out the ones gone, with their day', () => {
    const changed = { ...READING, seconds: 1200 }

    expect(activityChangesBetween([READING, WORK, CALL], [changed, WORK])).toEqual({ saved: [changed], removed: [CALL] })
  })

  it('takes a record moved to another day out of the one it was under', () => {
    const moved = { ...CALL, day: '2026-10-02' }

    expect(activityChangesBetween([CALL], [moved])).toEqual({ saved: [moved], removed: [CALL] })
  })
})
