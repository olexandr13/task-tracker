import { DEFAULT_ASSISTANT_DEVICE, type AssistantDeviceRepository } from './assistantDeviceRepository'
import { readAssistantDevice, toStoredAssistantDevice } from './assistantDeviceSchema'
import { createLocalStorageSetting } from './localStorageSetting'

/** The assistant's key and last answer, in this browser's `localStorage` (STORE-69). */
export const localStorageAssistantDeviceRepository: AssistantDeviceRepository = createLocalStorageSetting({
  key: 'task-tracker/assistant',
  read: readAssistantDevice,
  write: toStoredAssistantDevice,
  fallback: DEFAULT_ASSISTANT_DEVICE,
})
