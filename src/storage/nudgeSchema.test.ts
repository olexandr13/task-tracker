import { describe, expect, it } from 'vitest'
import { NUDGE_RESTING } from './nudgeRepository'
import { NUDGE_SCHEMA_VERSION, readNudge, toStoredNudge } from './nudgeSchema'

/* The saved shape of the nudge's setting (NUDGE-7 in wiki/nudges.md). */

const ON = {
  on: true,
  quietHours: 3,
  nudgedAt: '2026-09-16T10:00:00.000Z',
  standing: { taskId: 'task-1', quietHours: 3 },
} as const

describe('toStoredNudge', () => {
  it('saves nothing while the nudge is off and has never fired', () => {
    expect(toStoredNudge(NUDGE_RESTING)).toBeNull()
  })

  it('saves the setting under its version', () => {
    expect(toStoredNudge(ON)).toEqual({ version: NUDGE_SCHEMA_VERSION, ...ON })
  })

  it('keeps a setting turned off again, since the span and the last nudge outlive it', () => {
    expect(toStoredNudge({ ...ON, on: false })).not.toBeNull()
  })
})

describe('readNudge', () => {
  it('reads back what was saved', () => {
    expect(readNudge(toStoredNudge(ON))).toEqual(ON)
  })

  it('refuses another version, or anything that is not a setting', () => {
    expect(readNudge({ ...ON, version: NUDGE_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readNudge({ version: NUDGE_SCHEMA_VERSION })).toBeNull()
    expect(readNudge(null)).toBeNull()
    expect(readNudge('on')).toBeNull()
  })

  it('refuses a last-nudge stamp that is not a time', () => {
    expect(readNudge({ version: NUDGE_SCHEMA_VERSION, on: true, quietHours: 2, nudgedAt: 'soon' })).toBeNull()
  })

  it('falls back to the default span rather than losing the setting', () => {
    expect(readNudge({ version: NUDGE_SCHEMA_VERSION, on: true, quietHours: 9, nudgedAt: null })).toEqual({
      on: true,
      quietHours: NUDGE_RESTING.quietHours,
      nudgedAt: null,
      standing: null,
    })
  })

  it('shows no notice rather than a standing one it cannot read', () => {
    const broken = { ...ON, version: NUDGE_SCHEMA_VERSION, standing: { taskId: '', quietHours: 3 } }
    expect(readNudge(broken)?.standing).toBeNull()
  })
})
