import { describe, expect, it } from 'vitest'
import { HABIT_VIEW_OPTIONS_SCHEMA_VERSION, readHabitViewOptions, toStoredHabitViewOptions } from './habitViewOptionsSchema'

/* Reading saved habits view options back (STORE-36 in wiki/storage.md). */

describe('readHabitViewOptions', () => {
  it('reads back what was saved', () => {
    expect(readHabitViewOptions(toStoredHabitViewOptions({ showDetails: true }))).toEqual({ showDetails: true })
    expect(readHabitViewOptions(toStoredHabitViewOptions({ showDetails: false }))).toEqual({ showDetails: false })
  })

  it('does not trust a version it does not know', () => {
    expect(readHabitViewOptions({ version: HABIT_VIEW_OPTIONS_SCHEMA_VERSION + 1, options: { showDetails: false } })).toBeNull()
  })

  it('does not trust options that are not shaped as they should be', () => {
    expect(readHabitViewOptions(null)).toBeNull()
    expect(readHabitViewOptions('collapse')).toBeNull()
    expect(readHabitViewOptions({ version: HABIT_VIEW_OPTIONS_SCHEMA_VERSION })).toBeNull()
    expect(readHabitViewOptions({ version: HABIT_VIEW_OPTIONS_SCHEMA_VERSION, options: [] })).toBeNull()
    expect(readHabitViewOptions({ version: HABIT_VIEW_OPTIONS_SCHEMA_VERSION, options: { showDetails: 'yes' } })).toBeNull()
  })
})
