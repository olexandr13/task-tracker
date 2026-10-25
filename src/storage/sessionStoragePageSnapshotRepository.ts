import type { PageSnapshot, PageSnapshotRepository } from './pageSnapshotRepository'

const STORAGE_KEY = 'task-tracker/page-snapshot'

/**
 * Bump this whenever the saved shape changes. Nothing older is migrated: a
 * picture of the page stands in for one reload at most, and without it the
 * reload simply waits for the page, as it always did.
 */
const SCHEMA_VERSION = 1

/**
 * The longest page kept, in characters. A long habits page runs to a few hundred
 * thousand; anything far past that is left to load as it is rather than filling
 * the tab's storage.
 */
const LONGEST = 2_000_000

/** Returns the kept page in today's shape, or null if it can't be trusted. */
function read(data: unknown): PageSnapshot | null {
  if (typeof data !== 'object' || data === null) return null

  const { version, address, day, phone, html } = data as Record<string, unknown>
  if (version !== SCHEMA_VERSION) return null
  if (typeof address !== 'string' || typeof day !== 'string' || typeof phone !== 'boolean' || typeof html !== 'string') {
    return null
  }

  return { address, day, phone, html }
}

/**
 * The page as it was left, in the tab's `sessionStorage`: it survives a reload
 * and is gone with the tab, so it never outlives the visit it pictures — and it
 * has a quota of its own, apart from the settings in `localStorage`.
 */
export const sessionStoragePageSnapshotRepository: PageSnapshotRepository = {
  load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw === null ? null : read(JSON.parse(raw))
    } catch {
      return null
    }
  },

  save(snapshot) {
    try {
      if (snapshot === null || snapshot.html.length > LONGEST) sessionStorage.removeItem(STORAGE_KEY)
      else sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, ...snapshot }))
    } catch {
      // Full, or refused: an older picture must not stand in for this page.
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // No storage at all: the reload waits for the page, as it did before.
      }
    }
  },
}
