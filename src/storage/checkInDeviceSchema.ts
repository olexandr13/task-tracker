import type { CheckInDeviceState } from './checkInDeviceRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of what the check-in keeps on this device (STORE-54). Its own
 * version, apart from the account's setting (./checkInSchema); bump it whenever
 * the shape below changes and migrate on load (STORE-5).
 *
 * Version 1 also kept whether this device was pushed check-ins while the app
 * was closed, which is gone; its dismissed hour is read as it is.
 */
export const CHECK_IN_DEVICE_SCHEMA_VERSION = 2

export interface StoredCheckInDevice {
  version: number
  dismissedSlot: string | null
}

const SLOT_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}$/

/** What to save: nothing while the device is as it arrived. */
export function toStoredCheckInDevice(state: CheckInDeviceState): StoredCheckInDevice | null {
  if (state.dismissedSlot === null) return null
  return { version: CHECK_IN_DEVICE_SCHEMA_VERSION, dismissedSlot: state.dismissedSlot }
}

/**
 * What this device saved, in today's shape, or null when it cannot be trusted.
 * Unreadable reads as a device arriving: the worst of it is a notice shown once
 * more.
 */
export function readCheckInDevice(data: unknown): CheckInDeviceState | null {
  if (!isRecord(data) || (data.version !== 1 && data.version !== CHECK_IN_DEVICE_SCHEMA_VERSION)) return null

  const { dismissedSlot } = data
  return { dismissedSlot: typeof dismissedSlot === 'string' && SLOT_KEY.test(dismissedSlot) ? dismissedSlot : null }
}
