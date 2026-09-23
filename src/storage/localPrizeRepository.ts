import type { Prize } from '../core'
import { createLocalCollection } from './localCollection'
import type { PrizeRepository } from './prizeRepository'
import { readPrize, toStoredPrize } from './prizeSchema'

const STORAGE_KEY = 'task-tracker/guest/prizes'

const collection = createLocalCollection<Prize>({
  key: STORAGE_KEY,
  read: readPrize,
  write: toStoredPrize,
  idOf: (prize) => prize.id,
})

/** The guest's wishlist in this browser — never leaves the device. */
export function createLocalPrizeRepository(): PrizeRepository {
  return {
    subscribe(onPrizes, onError) {
      return collection.subscribe(onPrizes, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },
  }
}

export function loadGuestPrizes(): Prize[] {
  return collection.load()
}

export function clearGuestPrizes(): void {
  collection.clear()
}
