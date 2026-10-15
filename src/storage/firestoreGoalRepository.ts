import type { Firestore } from 'firebase/firestore'
import type { Goal } from '../core'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'
import type { GoalRepository } from './goalRepository'
import { readGoal, toStoredGoal } from './goalSchema'

const GOAL: RecordKind<Goal> = { noun: 'goal', read: readGoal, write: toStoredGoal }

/**
 * An account's goals in Firestore: one document per goal, filed under the
 * account at `users/{accountId}/goals/{goalId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Beside the tasks rather than holding them: a task names its goal by id
 * (`../core/goal`), so a goal is renamed, made or deleted without a single task
 * being written. Like the lists it opens offline from the browser's copy, and
 * when two devices change the same goal the later write wins.
 */
export function createFirestoreGoalRepository(firestore: Firestore, accountId: string): GoalRepository {
  const goals = accountCollection(firestore, accountId, 'goals')

  return {
    subscribe: (onGoals, onError) => subscribeToRecords(goals, GOAL, onGoals, onError),
    save: (changes) => saveRecords(firestore, goals, GOAL, changes),
  }
}
