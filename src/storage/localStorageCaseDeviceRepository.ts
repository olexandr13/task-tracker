import { CASES_AT_REST, type CaseDeviceRepository } from './caseDeviceRepository'
import { readCaseDevice, toStoredCaseDevice } from './caseDeviceSchema'
import { createLocalStorageSetting } from './localStorageSetting'

/** What Cases keeps in this browser (STORE-49). The key stays `task-tracker/chest` so a device that already saved this still finds it. */
export const localStorageCaseDeviceRepository: CaseDeviceRepository = createLocalStorageSetting({
  key: 'task-tracker/chest',
  read: readCaseDevice,
  write: toStoredCaseDevice,
  fallback: CASES_AT_REST,
})
