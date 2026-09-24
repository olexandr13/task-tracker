import type { WarmUp } from '../core'
import type { WarmUpRepository } from './warmUpRepository'
import { readWarmUp, toStoredWarmUp } from './warmUpSchema'

const STORAGE_KEY = 'task-tracker/guest/warmUp'

type Listener = (warmUp: WarmUp | null) => void

const listeners = new Set<Listener>()

function readStore(): WarmUp | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readWarmUp(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring the saved guest warm-up: could not be read.', error)
    return null
  }
}

function writeStore(warmUp: WarmUp | null): void {
  try {
    if (warmUp === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredWarmUp(warmUp)))
  } catch (error) {
    console.error('Could not save the guest warm-up.', error)
    throw error
  }
}

function emit(warmUp: WarmUp | null): void {
  for (const listener of listeners) listener(warmUp)
}

/** Another tab of this browser changed it: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's warm-up (WARM-1) in this browser alone (STORE-37), kept the way
 * the guest's other account data is: written under its own key, read back
 * through the same schema the account uses, and shared across this browser's
 * tabs.
 */
export function createLocalWarmUpRepository(): WarmUpRepository {
  return {
    subscribe(onWarmUp, onError) {
      listeners.add(onWarmUp)
      try {
        onWarmUp(readStore())
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onWarmUp)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async save(warmUp) {
      writeStore(warmUp)
      emit(warmUp)
    },

    async importWarmUp(warmUp) {
      if (readStore() !== null) return
      writeStore(warmUp)
      emit(warmUp)
    },
  }
}

export function loadGuestWarmUp(): WarmUp | null {
  return readStore()
}

export function clearGuestWarmUp(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(null)
}
