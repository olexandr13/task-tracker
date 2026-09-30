import { describe, expect, it } from 'vitest'
import { NUDGE_OFF, type NudgePreference } from './nudgeRepository'
import { NUDGE, NUDGE_SCHEMA_VERSION, readNudge, toStoredNudge } from './nudgeSchema'

/* The saved shape of the nudge's setting (NUDGE-9 in wiki/nudges.md). */

const ON: NudgePreference = {
  on: true,
  quietHours: 3,
  window: { from: '09:00', to: '22:00' },
}

/** A setting as the account keeps it, so a test can break one field of it. */
function stored(nudge: Partial<NudgePreference> = {}) {
  return { version: NUDGE_SCHEMA_VERSION, name: NUDGE, nudge: { ...ON, ...nudge } }
}

describe('toStoredNudge', () => {
  it('saves nothing for a nudge exactly as the app arrives', () => {
    expect(toStoredNudge(NUDGE_OFF)).toBeNull()
  })

  it('saves the setting under its version, filed under its name', () => {
    expect(toStoredNudge(ON)).toEqual(stored())
  })

  it('keeps a setting turned off again, since the span and the hours outlive it', () => {
    expect(toStoredNudge({ ...ON, on: false })).not.toBeNull()
  })
})

describe('readNudge', () => {
  it('reads back what was saved', () => {
    expect(readNudge(toStoredNudge(ON))).toEqual(ON)
  })

  it('refuses another version, or anything that is not a setting', () => {
    expect(readNudge({ ...stored(), version: NUDGE_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readNudge({ version: NUDGE_SCHEMA_VERSION, name: NUDGE })).toBeNull()
    expect(readNudge(null)).toBeNull()
    expect(readNudge('on')).toBeNull()
  })

  it('falls back to the default span rather than losing the setting', () => {
    expect(readNudge(stored({ quietHours: 9 as NudgePreference['quietHours'] }))).toEqual({
      ...ON,
      quietHours: NUDGE_OFF.quietHours,
    })
  })

  it('reads a setting with no hours as any hour (NUDGE-12)', () => {
    expect(readNudge(stored({ window: null }))).toEqual({ ...ON, window: null })
  })

  it('refuses hours it cannot read rather than speaking at any hour (NUDGE-12)', () => {
    // Taking a broken window as none would nudge at three in the morning, which
    // is the one thing setting hours asked against.
    expect(readNudge(stored({ window: { from: '09:00', to: '25:00' } }))).toBeNull()
    expect(readNudge(stored({ window: 'evenings' as unknown as NudgePreference['window'] }))).toBeNull()
  })
})
