import { describe, expect, it } from 'vitest'
import { CASES_AT_REST, type CaseDeviceState } from './caseDeviceRepository'
import { CASE_DEVICE_SCHEMA_VERSION, readCaseDevice, toStoredCaseDevice } from './caseDeviceSchema'

/* What Cases keeps on this device. STORE ids refer to wiki/storage.md. */

const GLOWING: CaseDeviceState = {
  sound: false,
  lastOpen: { day: '2026-09-17', quarter: 3 },
  noticedDay: '2026-09-17',
  noticedWeek: '2026-09-14',
}

describe('toStoredCaseDevice (STORE-49)', () => {
  it('saves nothing while Cases stands as it arrives', () => {
    expect(toStoredCaseDevice(CASES_AT_REST)).toBeNull()
  })

  it('saves the noise, the last opening and the notice already given', () => {
    expect(toStoredCaseDevice(GLOWING)).toEqual({
      version: CASE_DEVICE_SCHEMA_VERSION,
      sound: false,
      lastOpen: { day: '2026-09-17', quarter: 3 },
      noticedDay: '2026-09-17',
      noticedWeek: '2026-09-14',
    })
  })

  it('saves a noise turned off on its own', () => {
    expect(toStoredCaseDevice({ ...CASES_AT_REST, sound: false })).not.toBeNull()
  })
})

describe('readCaseDevice (STORE-49, STORE-24)', () => {
  it('reads back what this device kept', () => {
    const saved = toStoredCaseDevice(GLOWING)

    expect(readCaseDevice(saved)).toEqual(GLOWING)
  })

  it('trusts nothing in a version it does not know', () => {
    expect(readCaseDevice({ ...toStoredCaseDevice(GLOWING), version: 99 })).toBeNull()
    expect(readCaseDevice(null)).toBeNull()
    expect(readCaseDevice('cases')).toBeNull()
  })

  it('upgrades a version 1 record: the noise and the notice kept, the old tier forgotten', () => {
    const old = { version: 1, sound: false, lastOpen: { day: '2026-09-17', tier: 'haul' }, noticedDay: '2026-09-17' }

    expect(readCaseDevice(old)).toEqual({ sound: false, lastOpen: null, noticedDay: '2026-09-17', noticedWeek: null })
  })

  it('upgrades a version 2 record: Weekly has not been announced yet', () => {
    const old = {
      version: 2,
      sound: false,
      lastOpen: { day: '2026-09-17', quarter: 3 },
      noticedDay: '2026-09-17',
    }

    expect(readCaseDevice(old)).toEqual({ ...GLOWING, noticedWeek: null })
  })

  it('reads a record with no noise in it as a device arriving', () => {
    expect(readCaseDevice({ version: CASE_DEVICE_SCHEMA_VERSION })).toEqual(CASES_AT_REST)
  })

  it('drops an opening or a day it cannot read, keeping the noise (STORE-7)', () => {
    const saved = { version: CASE_DEVICE_SCHEMA_VERSION, sound: false }

    expect(readCaseDevice({ ...saved, lastOpen: { day: 'yesterday', quarter: 3 } })).toEqual({
      sound: false,
      lastOpen: null,
      noticedDay: null,
      noticedWeek: null,
    })
    expect(readCaseDevice({ ...saved, lastOpen: { day: '2026-09-17', quarter: 5 } })).toEqual({
      sound: false,
      lastOpen: null,
      noticedDay: null,
      noticedWeek: null,
    })
    expect(readCaseDevice({ ...saved, noticedDay: 42 })).toEqual({
      sound: false,
      lastOpen: null,
      noticedDay: null,
      noticedWeek: null,
    })
    expect(readCaseDevice({ ...saved, noticedWeek: 42 })).toEqual({
      sound: false,
      lastOpen: null,
      noticedDay: null,
      noticedWeek: null,
    })
  })
})
