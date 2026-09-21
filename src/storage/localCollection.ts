/**
 * A set of records kept in this browser's `localStorage`, shared across tabs of
 * the same address. Writes notify every subscriber on this page and every other
 * tab listening on the same key.
 */

import { isRecord } from './plainData'

type Listener<T> = (items: T[]) => void

interface CollectionState<T> {
  readonly items: Map<string, T>
}

interface LocalCollectionOptions<T> {
  readonly key: string
  /** Read one saved record, or null when it can't be trusted. */
  readonly read: (data: unknown) => T | null
  readonly write: (item: T) => unknown
  readonly idOf: (item: T) => string
  /** Optional seed when the key has never been written (e.g. legacy local tasks). */
  readonly seed?: () => T[]
}

/** One localStorage key holding many records, keyed by id. */
export interface LocalCollection<T> {
  load(): T[]
  subscribe(onItems: Listener<T>, onError: (error: unknown) => void): () => void
  /** Writes saved records and drops removed ones, then notifies subscribers. */
  apply(saved: readonly T[], removed: readonly string[]): void
  /** Replaces the whole set (backup import). */
  replace(items: readonly T[]): void
  clear(): void
}

export function createLocalCollection<T>(options: LocalCollectionOptions<T>): LocalCollection<T> {
  const listeners = new Set<Listener<T>>()

  function readStore(): CollectionState<T> {
    try {
      const raw = localStorage.getItem(options.key)
      if (raw === null) {
        const seeded = options.seed?.() ?? []
        if (seeded.length === 0) return { items: new Map() }
        const items = new Map(seeded.map((item) => [options.idOf(item), item]))
        writeStore(items)
        return { items }
      }
      const parsed: unknown = JSON.parse(raw)
      if (!isRecord(parsed) || !isRecord(parsed.records)) return { items: new Map() }

      const items = new Map<string, T>()
      for (const [id, data] of Object.entries(parsed.records)) {
        const item = options.read(data)
        if (item === null) {
          console.warn(`Ignoring saved record ${id} at ${options.key}: unexpected shape.`)
          continue
        }
        items.set(options.idOf(item), item)
      }
      return { items }
    } catch (error) {
      console.warn(`Ignoring saved data at ${options.key}: could not be read.`, error)
      return { items: new Map() }
    }
  }

  function writeStore(items: Map<string, T>): void {
    const records: Record<string, unknown> = {}
    for (const [id, item] of items) records[id] = options.write(item)
    try {
      localStorage.setItem(options.key, JSON.stringify({ records }))
    } catch (error) {
      console.error(`Could not save to ${options.key}.`, error)
      throw error
    }
  }

  function emit(items: Map<string, T>): void {
    const list = [...items.values()]
    for (const listener of listeners) listener(list)
  }

  function onStorage(event: StorageEvent): void {
    if (event.key !== options.key || event.storageArea !== localStorage) return
    emit(readStore().items)
  }

  return {
    load() {
      return [...readStore().items.values()]
    },

    subscribe(onItems, onError) {
      listeners.add(onItems)
      try {
        onItems([...readStore().items.values()])
      } catch (error) {
        onError(error)
      }
      if (listeners.size === 1) window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onItems)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },

    apply(saved, removed) {
      const { items } = readStore()
      for (const id of removed) items.delete(id)
      for (const item of saved) items.set(options.idOf(item), item)
      writeStore(items)
      emit(items)
    },

    replace(incoming) {
      const items = new Map(incoming.map((item) => [options.idOf(item), item]))
      writeStore(items)
      emit(items)
    },

    clear() {
      try {
        localStorage.removeItem(options.key)
      } catch {
        // Nothing to clear.
      }
      emit(new Map())
    },
  }
}
