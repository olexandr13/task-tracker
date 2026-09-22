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
  }
}
