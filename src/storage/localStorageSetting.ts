/**
 * One setting kept in this browser's `localStorage` under a key of its own —
 * how a view is shown, a running timer — rather than in the account.
 *
 * A setting that cannot be read is worth nothing: it is set again with a click,
 * so anything unexpected, an unknown version included, reads as `fallback`
 * rather than being carried forward. A browser that refuses storage altogether,
 * as some private windows do, keeps the setting for as long as the page is open.
 */
export interface LocalStorageSetting<T> {
  load(): T
  save(value: T): void
  /**
   * Calls `listener` whenever another window of the app on this device saves the
   * setting (STORE-61), so it can be read again; returns how to stop.
   */
  subscribe(listener: () => void): () => void
}

interface LocalStorageSettingOptions<T> {
  readonly key: string
  /** The setting in today's shape, or null when what is saved cannot be trusted. */
  readonly read: (data: unknown) => T | null
  /** What to save, under its version — or null to save nothing, for a setting at its resting value. */
  readonly write: (value: T) => unknown
  readonly fallback: T
}

export function createLocalStorageSetting<T>({ key, read, write, fallback }: LocalStorageSettingOptions<T>): LocalStorageSetting<T> {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key)
        return raw === null ? fallback : (read(JSON.parse(raw)) ?? fallback)
      } catch {
        return fallback
      }
    },

    save(value) {
      try {
        const stored = write(value)
        if (stored === null) localStorage.removeItem(key)
        else localStorage.setItem(key, JSON.stringify(stored))
      } catch {
        // Kept on screen for this visit only; there is nothing more to do about it.
      }
    },

    subscribe(listener) {
      // The browser tells every other window of the app when one saves; the one
      // saving is not told. A key of null is everything cleared at once.
      function handleStorage(event: StorageEvent) {
        if (event.storageArea === localStorage && (event.key === key || event.key === null)) listener()
      }

      window.addEventListener('storage', handleStorage)
      return () => { window.removeEventListener('storage', handleStorage) }
    },
  }
}
