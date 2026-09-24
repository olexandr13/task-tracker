import type { ProcrastinationState } from '../core'
import type { ProcrastinationRepository } from './procrastinationRepository'
import { readProcrastination, toStoredProcrastination } from './procrastinationSchema'

const STORAGE_KEY = 'task-tracker/guest/procrastination'

type Listener = (state: ProcrastinationState | null) => void

const listeners = new Set<Listener>()

function readStore(): ProcrastinationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readProcrastination(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring the saved guest Procrastination mode: could not be read.', error)
    return null
  }
}

function writeStore(state: ProcrastinationState | null): void {
  try {
    if (state === null || state.phase === 'off') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredProcrastination(state)))
  } catch (error) {
    console.error('Could not save the guest Procrastination mode.', error)
    throw error
  }
}

function emit(state: ProcrastinationState | null): void {
  for (const listener of listeners) listener(state)
}

/** Another tab of this browser changed it: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  emit(readStore())
}

/**
 * The guest's Procrastination mode in this browser alone (STORE-37), kept the
 * way the guest's other account data is: written under its own key, read back
 * through the same schema the account uses, and shared across this browser's
 * tabs. A guest has the one browser, so that is as far as the mode can travel.
 */
export function createLocalProcrastinationRepository(): ProcrastinationRepository {
  return {
    subscribe(onState, onError) {
      listeners.add(onState)
      try {
        onState(readStore())
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onState)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async save(state) {
      writeStore(state)
      emit(state)
    },
  }
}

/** Forgets the guest's mode, as signing in forgets the rest of the guest's data (STORE-38). */
export function clearGuestProcrastination(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  emit(null)
}
