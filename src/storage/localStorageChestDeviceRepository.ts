import { CHEST_AT_REST, type ChestDeviceRepository } from './chestDeviceRepository'
import { readChestDevice, toStoredChestDevice } from './chestDeviceSchema'
import { createLocalStorageSetting } from './localStorageSetting'

/** What the chest keeps in this browser (STORE-49). */
export const localStorageChestDeviceRepository: ChestDeviceRepository = createLocalStorageSetting({
  key: 'task-tracker/chest',
  read: readChestDevice,
  write: toStoredChestDevice,
  fallback: CHEST_AT_REST,
})
