import type { NudgePreference, NudgeRepository } from './nudgeRepository'
import { readNudge, toStoredNudge } from './nudgeSchema'

const STORAGE_KEY = 'task-tracker/guest/nudge'

type Listener = (preference: NudgePreference | null) => void

const listeners = new Set<Listener>()

function readStore(): NudgePreference | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readNudge(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring the saved guest nudge setting: could not be read.', error)
    return null
  }
}

function writeStore(preference: NudgePreference): void {
  try {
    const stored = toStoredNudge(preference)
    if (stored === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Could not save the guest nudge setting.', error)
    throw error
  }
}

function emit(preference: NudgePreference | null): void {
  for (const listener of listeners) listener(preference)
}

/** Another tab of this browser changed it: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's nudge setting in this browser alone (STORE-37), kept the way the
 * guest's other account data is: written under its own key, read back through
 * the same schema the account uses, and shared across this browser's tabs. A
 * guest has the one browser, so that is as far as the setting can travel.
 */
export function createLocalNudgeRepository(): NudgeRepository {
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

    async importNudge(preference) {
      if (readStore() !== null) return
      writeStore(preference)
      emit(preference)
    },
  }
}

export function loadGuestNudge(): NudgePreference | null {
  return readStore()
}

export function clearGuestNudge(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(null)
}
