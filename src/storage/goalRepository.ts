import type { Goal, GoalId } from '../core'
import type { RecordChanges } from './recordChanges'

/** What one change to the goals comes to, goal by goal (./recordChanges). */
export type GoalChanges = RecordChanges<Goal, GoalId>

/**
 * Where an account's goals live. Every call site talks to this interface rather
 * than to the service behind it, as with the lists (./listRepository).
 *
 * Changes are written goal by goal, never as the whole set, so a device only
 * ever writes the goals it changed and cannot undo what another device did to
 * the rest meanwhile.
 */
export interface GoalRepository {
  /**
   * Calls back with every saved goal once they are known, and again whenever
   * they change — here, in another tab or on another device. Returns the way to stop.
   */
  subscribe(onGoals: (goals: Goal[]) => void, onError: (error: unknown) => void): () => void
  save(changes: GoalChanges): Promise<void>
}
