import { describe, expect, it } from 'vitest'
import { CHEST_AT_REST, type ChestDeviceState } from './chestDeviceRepository'
import { CHEST_DEVICE_SCHEMA_VERSION, readChestDevice, toStoredChestDevice } from './chestDeviceSchema'

/* What the chest keeps on this device. STORE ids refer to wiki/storage.md. */

const GLOWING: ChestDeviceState = {
  sound: false,
  lastOpen: { day: '2026-09-17', tier: 'haul' },
  noticedDay: '2026-09-17',
}

describe('toStoredChestDevice (STORE-49)', () => {
  it('saves nothing while the chest stands as it arrives', () => {
    expect(toStoredChestDevice(CHEST_AT_REST)).toBeNull()
  })

  it('saves the noise, the last opening and the notice already given', () => {
    expect(toStoredChestDevice(GLOWING)).toEqual({
      version: CHEST_DEVICE_SCHEMA_VERSION,
      sound: false,
      lastOpen: { day: '2026-09-17', tier: 'haul' },
      noticedDay: '2026-09-17',
    })
  })

  it('saves a noise turned off on its own', () => {
    expect(toStoredChestDevice({ ...CHEST_AT_REST, sound: false })).not.toBeNull()
  })
})

describe('readChestDevice (STORE-49, STORE-24)', () => {
  it('reads back what this device kept', () => {
    const saved = toStoredChestDevice(GLOWING)

    expect(readChestDevice(saved)).toEqual(GLOWING)
  })

  it('trusts nothing in a version it does not know', () => {
    expect(readChestDevice({ ...toStoredChestDevice(GLOWING), version: 99 })).toBeNull()
    expect(readChestDevice(null)).toBeNull()
    expect(readChestDevice('chest')).toBeNull()
  })

  it('reads a record with no noise in it as a device arriving', () => {
    expect(readChestDevice({ version: CHEST_DEVICE_SCHEMA_VERSION })).toEqual(CHEST_AT_REST)
  })

  it('drops an opening or a day it cannot read, keeping the noise (STORE-7)', () => {
    const saved = { version: CHEST_DEVICE_SCHEMA_VERSION, sound: false }

    expect(readChestDevice({ ...saved, lastOpen: { day: 'yesterday', tier: 'haul' } })).toEqual({
      sound: false,
      lastOpen: null,
      noticedDay: null,
    })
    expect(readChestDevice({ ...saved, lastOpen: { day: '2026-09-17', tier: 'bonanza' } })).toEqual({
      sound: false,
      lastOpen: null,
      noticedDay: null,
    })
    expect(readChestDevice({ ...saved, noticedDay: 42 })).toEqual({ sound: false, lastOpen: null, noticedDay: null })
  })
})
