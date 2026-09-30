import { describe, expect, it } from 'vitest'
import { NUDGE_UNSPOKEN, type NudgeDeviceState } from './nudgeDeviceRepository'
import {
  NUDGE_DEVICE_SCHEMA_VERSION,
  readLegacyNudgePreference,
  readNudgeDevice,
  toStoredNudgeDevice,
} from './nudgeDeviceSchema'

/* What the nudge keeps on this device (NUDGE-6 in wiki/nudges.md). */

const SPOKEN: NudgeDeviceState = {
  nudgedAt: '2026-09-16T10:00:00.000Z',
  standing: { taskId: 'task-1', quietHours: 3 },
}

describe('toStoredNudgeDevice', () => {
  it('saves nothing while this device has never nudged', () => {
    expect(toStoredNudgeDevice(NUDGE_UNSPOKEN)).toBeNull()
  })

  it('saves what this device remembers, under its version', () => {
    expect(toStoredNudgeDevice(SPOKEN)).toEqual({ version: NUDGE_DEVICE_SCHEMA_VERSION, ...SPOKEN })
  })
})

describe('readNudgeDevice', () => {
  it('reads back what was saved', () => {
    expect(readNudgeDevice(toStoredNudgeDevice(SPOKEN))).toEqual(SPOKEN)
  })

  it('refuses another version, or anything that is not a record of it', () => {
    expect(readNudgeDevice({ ...SPOKEN, version: NUDGE_DEVICE_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readNudgeDevice(null)).toBeNull()
    expect(readNudgeDevice('nudged')).toBeNull()
  })

  it('reads a last-nudge stamp that is not a time as nothing said here yet', () => {
    expect(readNudgeDevice({ version: NUDGE_DEVICE_SCHEMA_VERSION, nudgedAt: 'soon', standing: null })).toEqual(
      NUDGE_UNSPOKEN,
    )
  })

  it('shows no notice rather than a standing one it cannot read', () => {
    const broken = { ...SPOKEN, version: NUDGE_DEVICE_SCHEMA_VERSION, standing: { taskId: '', quietHours: 3 } }
    expect(readNudgeDevice(broken)?.standing).toBeNull()
  })

  it('keeps what a record from before the setting synced still answers (STORE-46)', () => {
    // Versions 1 and 2 held the setting here too; only these two fields are the
    // device's now, and the setting in them is moved into the account instead.
    const version2 = { version: 2, on: true, quietHours: 3, window: null, ...SPOKEN }
    expect(readNudgeDevice(version2)).toEqual(SPOKEN)
  })
})

describe('readLegacyNudgePreference', () => {
  it('takes the setting out of a record from before it synced (STORE-46)', () => {
    const version2 = { version: 2, on: true, quietHours: 3, window: { from: '09:00', to: '22:00' }, ...SPOKEN }
    expect(readLegacyNudgePreference(version2)).toEqual({
      on: true,
      quietHours: 3,
      window: { from: '09:00', to: '22:00' },
    })
  })

  it('reads one saved before there were hours as any hour (NUDGE-12)', () => {
    // Version 1 knew no hours to keep to, and spoke at whatever hour the quiet ran out.
    expect(readLegacyNudgePreference({ version: 1, on: true, quietHours: 3, nudgedAt: null })).toEqual({
      on: true,
      quietHours: 3,
      window: null,
    })
  })

  it('has nothing to take from a record already in today’s shape, or from one saying only the defaults', () => {
    expect(readLegacyNudgePreference(toStoredNudgeDevice(SPOKEN))).toBeNull()
    expect(readLegacyNudgePreference({ version: 2, on: false, quietHours: 2, window: null, nudgedAt: null })).toBeNull()
    expect(readLegacyNudgePreference(null)).toBeNull()
  })
})
