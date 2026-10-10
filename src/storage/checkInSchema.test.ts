import { describe, expect, it } from 'vitest'
import { CHECK_IN_OFF } from './checkInRepository'
import { CHECK_IN_DEVICE_SCHEMA_VERSION, readCheckInDevice, toStoredCheckInDevice } from './checkInDeviceSchema'
import { CHECK_IN_DEVICE_NEW } from './checkInDeviceRepository'
import { CHECK_IN_SCHEMA_VERSION, readCheckIn, toStoredCheckIn } from './checkInSchema'

/* Reading the check-in back. STORE ids refer to wiki/storage.md. */

describe('the check-in setting (STORE-52)', () => {
  const on = { on: true, window: { from: '08:00', to: '20:00' } }

  it('reads back what was saved, and keeps no record for one as the app arrives', () => {
    expect(readCheckIn(toStoredCheckIn(on))).toEqual(on)
    expect(toStoredCheckIn(CHECK_IN_OFF)).toBeNull()
    // Off, but with hours of its own: those are worth keeping.
    expect(readCheckIn(toStoredCheckIn({ ...on, on: false }))).toEqual({ ...on, on: false })
  })

  it('trusts nothing in a version it does not know, or hours not on the hour (STORE-7)', () => {
    const stored = toStoredCheckIn(on)

    expect(readCheckIn({ ...stored, version: CHECK_IN_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readCheckIn({ ...stored, checkIn: { on: 'yes', window: on.window } })).toBeNull()
    expect(readCheckIn({ ...stored, checkIn: { on: true, window: { from: '08:30', to: '20:00' } } })).toBeNull()
    expect(readCheckIn({ ...stored, checkIn: { on: true, window: null } })).toBeNull()
    expect(readCheckIn(null)).toBeNull()
  })
})

describe('what the check-in keeps on this device (STORE-54)', () => {
  const state = { dismissedSlot: '2026-10-02T14' }

  it('reads back what was saved, and keeps nothing for a device as it arrives', () => {
    expect(readCheckInDevice(toStoredCheckInDevice(state))).toEqual(state)
    expect(toStoredCheckInDevice(CHECK_IN_DEVICE_NEW)).toBeNull()
  })

  it('keeps the hour dismissed from the version that also kept push, and lets push go', () => {
    expect(readCheckInDevice({ version: 1, dismissedSlot: '2026-10-02T14', pushDeviceId: 'device-1', pushOn: true })).toEqual(state)
  })

  it('reads what it cannot trust as nothing there', () => {
    expect(readCheckInDevice({ version: 99, ...state })).toBeNull()
    expect(readCheckInDevice({ version: CHECK_IN_DEVICE_SCHEMA_VERSION, dismissedSlot: 'yesterday' })).toEqual(CHECK_IN_DEVICE_NEW)
  })
})
