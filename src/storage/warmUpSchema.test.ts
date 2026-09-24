import { describe, expect, it } from 'vitest'
import { startWarmUp } from '../core'
import { readWarmUp, toStoredWarmUp, WARM_UP, WARM_UP_SCHEMA_VERSION } from './warmUpSchema'

/* Reading a saved warm-up back. STORE ids refer to wiki/storage.md. */

const WARMING_UP = startWarmUp(new Date(2026, 8, 1, 9, 0))

describe('saving a warm-up', () => {
  it('saves the day it began on, under its version and name (STORE-44)', () => {
    expect(toStoredWarmUp(WARMING_UP)).toEqual({
      version: WARM_UP_SCHEMA_VERSION,
      name: WARM_UP,
      warmUp: { startedOn: '2026-09-01' },
    })
  })

  it('reads back exactly what it saved', () => {
    expect(readWarmUp(toStoredWarmUp(WARMING_UP))).toEqual(WARMING_UP)
  })
})

describe('reading a saved warm-up', () => {
  it('reads nothing of a version it does not know (STORE-7)', () => {
    expect(readWarmUp({ ...toStoredWarmUp(WARMING_UP), version: WARM_UP_SCHEMA_VERSION + 1 })).toBeNull()
  })

  it('reads nothing of a shape it does not know', () => {
    expect(readWarmUp(null)).toBeNull()
    expect(readWarmUp('warming up')).toBeNull()
    expect(readWarmUp({ version: WARM_UP_SCHEMA_VERSION, name: WARM_UP })).toBeNull()
  })

  it('reads nothing of a day that is no day', () => {
    const stored = toStoredWarmUp(WARMING_UP)
    expect(readWarmUp({ ...stored, warmUp: { startedOn: '2026-02-30' } })).toBeNull()
    expect(readWarmUp({ ...stored, warmUp: { startedOn: 'yesterday' } })).toBeNull()
    expect(readWarmUp({ ...stored, warmUp: { startedOn: 20260901 } })).toBeNull()
  })
})
