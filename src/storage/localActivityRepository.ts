import type { ActivityEntry } from '../core'
import type { ActivityRepository } from './activityRepository'
import { readActivityEntry, toStoredActivityEntry } from './activitySchema'
import { createLocalCollection } from './localCollection'

const STORAGE_KEY = 'task-tracker/guest/activities'

const collection = createLocalCollection<ActivityEntry>({
  key: STORAGE_KEY,
  read: readActivityEntry,
  write: toStoredActivityEntry,
  idOf: (entry) => entry.id,
})

/** The guest's activity log in this browser — never leaves the device. */
export function createLocalActivityRepository(): ActivityRepository {
  return {
    subscribe(onEntries, onError) {
      return collection.subscribe(onEntries, onError)
    },

    async save({ saved, removed }) {
      const kept = new Set(saved.map((entry) => entry.id))
      // A record moved to another day is removed and saved at once; here it is one record.
      collection.apply(saved, removed.map((entry) => entry.id).filter((id) => !kept.has(id)))
    },
  }
}

export function loadGuestActivities(): ActivityEntry[] {
  return collection.load()
}

export function clearGuestActivities(): void {
  collection.clear()
}
