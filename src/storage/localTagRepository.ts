import type { Tag } from '../core'
import { createLocalCollection } from './localCollection'
import type { TagRepository } from './tagRepository'
import { readTag, toStoredTag } from './tagSchema'

const STORAGE_KEY = 'task-tracker/guest/tags'

const collection = createLocalCollection<Tag>({
  key: STORAGE_KEY,
  read: readTag,
  write: toStoredTag,
  idOf: (tag) => tag.id,
})

/** The guest's kept tags in this browser — never leave the device. */
export function createLocalTagRepository(): TagRepository {
  return {
    subscribe(onTags, onError) {
      return collection.subscribe(onTags, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },
  }
}

export function loadGuestTags(): Tag[] {
  return collection.load()
}

export function clearGuestTags(): void {
  collection.clear()
}
