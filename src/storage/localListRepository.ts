import type { List } from '../core'
import { createLocalCollection } from './localCollection'
import type { ListRepository } from './listRepository'
import { readList, toStoredList } from './listSchema'

const STORAGE_KEY = 'task-tracker/guest/lists'

const collection = createLocalCollection<List>({
  key: STORAGE_KEY,
  read: readList,
  write: toStoredList,
  idOf: (list) => list.id,
})

/** The guest's lists in this browser — never leave the device. */
export function createLocalListRepository(): ListRepository {
  return {
    subscribe(onLists, onError) {
      return collection.subscribe(onLists, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },
  }
}

export function loadGuestLists(): List[] {
  return collection.load()
}

export function clearGuestLists(): void {
  collection.clear()
}
