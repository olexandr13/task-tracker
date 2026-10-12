import { describe, expect, it } from 'vitest'
import { HABIT_SETTINGS_SCHEMA_VERSION, readHabitRests, toStoredHabitRests } from './habitSettingsSchema'

/* Reading the limit on rests back. STORE ids refer to wiki/storage.md. */

describe('the limit on rests (STORE-63)', () => {
  it('reads back what was saved, and keeps no record while it is off', () => {
    expect(readHabitRests(toStoredHabitRests({ since: '2026-10-12' }))).toEqual({ since: '2026-10-12' })
    expect(toStoredHabitRests(null)).toBeNull()
  })

  it('trusts nothing in a version it does not know, or not shaped as the limit (STORE-7)', () => {
    const stored = toStoredHabitRests({ since: '2026-10-12' })

    expect(readHabitRests({ ...stored, version: HABIT_SETTINGS_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readHabitRests({ ...stored, since: '2026-02-30' })).toBeNull()
    expect(readHabitRests({ ...stored, since: 12 })).toBeNull()
    expect(readHabitRests(null)).toBeNull()
  })
})
