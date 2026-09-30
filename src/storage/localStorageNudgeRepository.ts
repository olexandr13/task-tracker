import { createLocalStorageSetting } from './localStorageSetting'
import { NUDGE_UNSPOKEN, type NudgeDeviceRepository } from './nudgeDeviceRepository'
import { readLegacyNudgePreference, readNudgeDevice, toStoredNudgeDevice } from './nudgeDeviceSchema'
import type { NudgePreference } from './nudgeRepository'

const STORAGE_KEY = 'task-tracker/nudge'

/**
 * What the nudge keeps on this device, in this browser's `localStorage`: the
 * moment it last spoke here, which is what keeps a reload from nudging all over
 * again, and the notice it left standing. Anything unreadable reads as nothing
 * said here yet.
 *
 * The setting itself is the account's (./nudgeRepository).
 */
export const localStorageNudgeRepository: NudgeDeviceRepository = createLocalStorageSetting({
  key: STORAGE_KEY,
  read: readNudgeDevice,
  write: toStoredNudgeDevice,
  fallback: NUDGE_UNSPOKEN,
})

/**
 * The setting this browser kept before the nudge became the account's
 * (STORE-46), or null where there is none to take. Moved into the account the
 * first time the app is open (`moveBrowserDataIn`), then forgotten
 * (`forgetLegacyNudge`) — the same rule as the tasks kept from before there
 * were accounts (STORE-19).
 */
export function loadLegacyNudge(): NudgePreference | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readLegacyNudgePreference(JSON.parse(raw))
  } catch {
    return null
  }
}

/**
 * Drops the setting out of this browser's record, keeping what is still the
 * device's — when it last spoke, and the notice it left standing — so a move
 * into the account does not cost a nudge already paid for.
 */
export function forgetLegacyNudge(): void {
  localStorageNudgeRepository.save(localStorageNudgeRepository.load())
}
