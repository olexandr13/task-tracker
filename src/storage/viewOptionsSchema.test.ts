import { describe, expect, it } from 'vitest'
import { readViewOptions, toStoredViewOptions, VIEW_OPTIONS_SCHEMA_VERSION } from './viewOptionsSchema'

/* Reading saved view options back (STORE-30 in wiki/storage.md). */

describe('readViewOptions', () => {
  it('reads back what was saved', () => {
    expect(readViewOptions(toStoredViewOptions({ showDetails: true }))).toEqual({ showDetails: true })
    expect(readViewOptions(toStoredViewOptions({ showDetails: false }))).toEqual({ showDetails: false })
  })

  it('does not trust a version it does not know', () => {
    expect(readViewOptions({ version: VIEW_OPTIONS_SCHEMA_VERSION + 1, options: { showDetails: true } })).toBeNull()
  })

  it('does not trust options that are not shaped as they should be', () => {
    expect(readViewOptions(null)).toBeNull()
    expect(readViewOptions('details')).toBeNull()
    expect(readViewOptions({ version: VIEW_OPTIONS_SCHEMA_VERSION })).toBeNull()
    expect(readViewOptions({ version: VIEW_OPTIONS_SCHEMA_VERSION, options: [] })).toBeNull()
    expect(readViewOptions({ version: VIEW_OPTIONS_SCHEMA_VERSION, options: { showDetails: 'yes' } })).toBeNull()
  })
})
