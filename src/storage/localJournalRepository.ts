import type { JournalEntry } from '../core'
import type { JournalRepository } from './journalRepository'
import { readJournalEntry, toStoredJournalEntry } from './journalSchema'
import { createLocalCollection } from './localCollection'

const STORAGE_KEY = 'task-tracker/guest/journal'

const collection = createLocalCollection<JournalEntry>({
  key: STORAGE_KEY,
  read: readJournalEntry,
  write: toStoredJournalEntry,
  idOf: (entry) => entry.id,
})

/** The guest's journal in this browser — never leaves the device. */
export function createLocalJournalRepository(): JournalRepository {
  return {
    subscribe(onEntries, onError) {
      return collection.subscribe(onEntries, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed.map((entry) => entry.id))
    },

    async forgetBefore(day) {
      const old = collection.load().filter((entry) => entry.day < day)
      if (old.length === 0) return
      collection.apply([], old.map((entry) => entry.id))
    },
  }
}

export function loadGuestJournal(): JournalEntry[] {
  return collection.load()
}

export function clearGuestJournal(): void {
  collection.clear()
}
