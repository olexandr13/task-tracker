import type { Goal } from '../core'
import type { GoalRepository } from './goalRepository'
import { readGoal, toStoredGoal } from './goalSchema'
import { createLocalCollection } from './localCollection'

const STORAGE_KEY = 'task-tracker/guest/goals'

const collection = createLocalCollection<Goal>({
  key: STORAGE_KEY,
  read: readGoal,
  write: toStoredGoal,
  idOf: (goal) => goal.id,
})

/** The guest's goals in this browser — never leave the device. */
export function createLocalGoalRepository(): GoalRepository {
  return {
    subscribe(onGoals, onError) {
      return collection.subscribe(onGoals, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },
  }
}

export function loadGuestGoals(): Goal[] {
  return collection.load()
}

export function clearGuestGoals(): void {
  collection.clear()
}
