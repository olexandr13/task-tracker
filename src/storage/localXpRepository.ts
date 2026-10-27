import { startXp, type XpProgress } from '../core'
import { isRecord } from './plainData'
import type { XpRepository } from './xpRepository'
import {
  migrateLegacyXp,
  readLegacyXpRecord,
  readLegacyXpStart,
  readXpProgress,
  toStoredXpProgress,
  type LegacyXp,
} from './xpSchema'

const STORAGE_KEY = 'task-tracker/guest/xp-progress'
/** Where version 1 kept the guest's ledger and the day it began (STORE-5). */
const LEGACY_RECORDS_KEY = 'task-tracker/guest/xp'
const LEGACY_START_KEY = 'task-tracker/guest/xp-start'

type Listener = (progress: XpProgress | null) => void

const listeners = new Set<Listener>()

function readStore(): XpProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? null : readXpProgress(JSON.parse(raw))
  } catch (error) {
    console.warn('Ignoring where the guest’s XP stands: could not be read.', error)
    return null
  }
}

function writeStore(progress: XpProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredXpProgress(progress)))
  } catch (error) {
    console.error('Could not save where the guest’s XP stands.', error)
    throw error
  }
  for (const listener of listeners) listener(progress)
}

/** What version 1 kept as guest, moved into where XP stands, or null for nothing kept. */
function readLegacy(): XpProgress | null {
  try {
    const rawStart = localStorage.getItem(LEGACY_START_KEY)
    const start = rawStart === null ? null : readLegacyXpStart(JSON.parse(rawStart))
    if (start === null) return null
    const rawRecords = localStorage.getItem(LEGACY_RECORDS_KEY)
    const parsed: unknown = rawRecords === null ? null : JSON.parse(rawRecords)
    const records: LegacyXp[] =
      isRecord(parsed) && isRecord(parsed.records)
        ? Object.values(parsed.records).flatMap((data) => readLegacyXpRecord(data) ?? [])
        : []
    return migrateLegacyXp(start, records)
  } catch {
    return null
  }
}

function forgetLegacy(): void {
  try {
    localStorage.removeItem(LEGACY_RECORDS_KEY)
    localStorage.removeItem(LEGACY_START_KEY)
  } catch {
    // Nothing to forget.
  }
}

/** Another tab of this browser changed it: this one hears about it too. */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return
  const progress = readStore()
  for (const listener of listeners) listener(progress)
}

/** Where the guest's XP stands, in this browser alone (STORE-37). */
export function createLocalXpRepository(): XpRepository {
  return {
    subscribe(onProgress, onError) {
      listeners.add(onProgress)
      try {
        onProgress(readStore())
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onProgress)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    async begin(day) {
      if (readStore() === null) writeStore(readLegacy() ?? startXp(day))
      forgetLegacy()
    },

    async add({ xp, adds }) {
      const stored = readStore()
      if (stored === null) return
      writeStore({ ...stored, xp: stored.xp + xp, ...(adds === null ? {} : { addsOn: adds.on, adds: adds.count }) })
    },

    async settle(count) {
      const stored = readStore()
      if (stored === null) return
      const settled = count(stored)
      if (settled === null) return
      writeStore({ ...stored, xp: stored.xp + settled.xp, settledThrough: settled.settledThrough })
    },

    async lift(least) {
      const stored = readStore()
      if (stored === null || stored.xp >= least) return
      writeStore({ ...stored, xp: least })
    },

    async importProgress(progress) {
      if (readStore() !== null) return
      writeStore(progress)
    },
  }
}

export function loadGuestXpProgress(): XpProgress | null {
  return readStore() ?? readLegacy()
}

export function clearGuestXp(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
  forgetLegacy()
  for (const listener of listeners) listener(null)
}
