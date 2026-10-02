import type { CheckInPreference, CheckInRepository } from './checkInRepository'
import { readCheckIn, toStoredCheckIn } from './checkInSchema'

const STORAGE_KEY = 'task-tracker/guest/check-in'

type Listener = (preference: CheckInPreference | null) => void

const listeners = new Set<Listener>()

function readStore(): CheckInPreference | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readCheckIn(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring the saved guest check-in setting: could not be read.', error)
    return null
  }
}

function writeStore(preference: CheckInPreference): void {
  try {
    const stored = toStoredCheckIn(preference)
    if (stored === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Could not save the guest check-in setting.', error)
    throw error
  }
}

function emit(preference: CheckInPreference | null): void {
  for (const listener of listeners) listener(preference)
}

/** Another tab of this browser changed it: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's check-in setting in this browser alone (STORE-37), kept as the
 * guest's nudge setting is (./localNudgeRepository).
 */
export function createLocalCheckInRepository(): CheckInRepository {
  return {
    subscribe(onPreference, onError) {
      listeners.add(onPreference)
      try {
        onPreference(readStore())
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onPreference)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async save(preference) {
      writeStore(preference)
      emit(preference)
    },

    async importCheckIn(preference) {
      if (readStore() !== null) return
      writeStore(preference)
      emit(preference)
    },
  }
}

export function loadGuestCheckIn(): CheckInPreference | null {
  return readStore()
}

export function clearGuestCheckIn(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(null)
}
