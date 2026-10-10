import { CHECK_IN_DEVICE_NEW, type CheckInDeviceRepository } from './checkInDeviceRepository'
import { readCheckInDevice, toStoredCheckInDevice } from './checkInDeviceSchema'
import { createLocalStorageSetting } from './localStorageSetting'

/**
 * What the check-in keeps on this device, in this browser's `localStorage`:
 * the notice dismissed here (STORE-54).
 * Anything unreadable reads as a device arriving.
 */
export const localStorageCheckInDeviceRepository: CheckInDeviceRepository = createLocalStorageSetting({
  key: 'task-tracker/check-in',
  read: readCheckInDevice,
  write: toStoredCheckInDevice,
  fallback: CHECK_IN_DEVICE_NEW,
})
