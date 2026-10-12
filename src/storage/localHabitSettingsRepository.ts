import type { HabitRests } from '../core'
import type { HabitSettingsRepository } from './habitSettingsRepository'
import { readHabitRests, toStoredHabitRests } from './habitSettingsSchema'

const STORAGE_KEY = 'task-tracker/guest/habit-rests'

type Listener = (rests: HabitRests) => void

const listeners = new Set<Listener>()

function readStore(): HabitRests {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readHabitRests(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring the saved guest limit on rests: could not be read.', error)
    return null
  }
}

function writeStore(rests: HabitRests): void {
  try {
    const stored = toStoredHabitRests(rests)
    if (stored === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Could not save the guest limit on rests.', error)
    throw error
  }
}

function emit(rests: HabitRests): void {
  for (const listener of listeners) listener(rests)
}

/** Another tab of this browser changed it: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's limit on rests in this browser alone (STORE-37), kept as the
 * guest's feature switches are (./localFeatureRepository).
 */
export function createLocalHabitSettingsRepository(): HabitSettingsRepository {
  return {
    subscribe(onRests, onError) {
      listeners.add(onRests)
      try {
        onRests(readStore())
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onRests)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async save(rests) {
      writeStore(rests)
      emit(rests)
    },

    async importRests(rests) {
      if (readStore() !== null) return
      writeStore(rests)
      emit(rests)
    },
  }
}

export function loadGuestHabitRests(): HabitRests {
  return readStore()
}

export function clearGuestHabitRests(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(null)
}
