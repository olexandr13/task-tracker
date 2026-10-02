import type { CheckInDeviceState } from './checkInDeviceRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of what the check-in keeps on this device (STORE-54). Its own
 * version, apart from the account's setting (./checkInSchema); bump it whenever
 * the shape below changes and migrate on load (STORE-5).
 */
export const CHECK_IN_DEVICE_SCHEMA_VERSION = 1

export interface StoredCheckInDevice {
  version: number
  dismissedSlot: string | null
  pushDeviceId: string | null
  pushOn: boolean
}

const SLOT_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}$/

/** What to save: nothing while the device is as it arrived. */
export function toStoredCheckInDevice(state: CheckInDeviceState): StoredCheckInDevice | null {
  if (state.dismissedSlot === null && state.pushDeviceId === null && !state.pushOn) return null
  return { version: CHECK_IN_DEVICE_SCHEMA_VERSION, ...state }
}

/**
 * What this device saved, in today's shape, or null when it cannot be trusted.
 * Unreadable reads as a device arriving: the worst of it is a notice shown once
 * more, and push to be turned on again here.
 */
export function readCheckInDevice(data: unknown): CheckInDeviceState | null {
  if (!isRecord(data) || data.version !== CHECK_IN_DEVICE_SCHEMA_VERSION) return null

  const { dismissedSlot, pushDeviceId, pushOn } = data
  return {
    dismissedSlot: typeof dismissedSlot === 'string' && SLOT_KEY.test(dismissedSlot) ? dismissedSlot : null,
    pushDeviceId: typeof pushDeviceId === 'string' && pushDeviceId !== '' ? pushDeviceId : null,
    pushOn: pushOn === true,
  }
}
