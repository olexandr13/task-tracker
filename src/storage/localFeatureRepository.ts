import type { FeaturesOff } from '../core'
import type { FeatureRepository } from './featureRepository'
import { readFeatures, toStoredFeatures } from './featureSchema'

const STORAGE_KEY = 'task-tracker/guest/features'

type Listener = (off: FeaturesOff | null) => void

const listeners = new Set<Listener>()

function readStore(): FeaturesOff | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readFeatures(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring the saved guest feature switches: could not be read.', error)
    return null
  }
}

function writeStore(off: FeaturesOff): void {
  try {
    const stored = toStoredFeatures(off)
    if (stored === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Could not save the guest feature switches.', error)
    throw error
  }
}

function emit(off: FeaturesOff | null): void {
  for (const listener of listeners) listener(off)
}

/** Another tab of this browser changed them: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's switches in this browser alone (STORE-37), kept as the guest's
 * nudge setting is (./localNudgeRepository).
 */
export function createLocalFeatureRepository(): FeatureRepository {
  return {
    subscribe(onFeatures, onError) {
      listeners.add(onFeatures)
      try {
        onFeatures(readStore())
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onFeatures)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async save(off) {
      writeStore(off)
      emit(off)
    },

    async importFeatures(off) {
      if (readStore() !== null) return
      writeStore(off)
      emit(off)
    },
  }
}

export function loadGuestFeatures(): FeaturesOff | null {
  return readStore()
}

export function clearGuestFeatures(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(null)
}
