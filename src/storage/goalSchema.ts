import { isGoalName, type Goal } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a goal. Its own version, apart from the tasks' and the
 * lists': a task names its goal by id, so neither reaches into the other. Bump
 * this whenever the shape below changes, and upgrade on reading.
 */
export const GOAL_SCHEMA_VERSION = 1

export interface StoredGoal {
  version: number
  goal: Goal
}

export function toStoredGoal(goal: Goal): StoredGoal {
  return { version: GOAL_SCHEMA_VERSION, goal }
}

/**
 * A saved goal in today's shape, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. A goal that cannot
 * be read is left unread rather than deleted, as a list is.
 */
export function readGoal(data: unknown): Goal | null {
  if (!isRecord(data) || data.version !== GOAL_SCHEMA_VERSION || !isRecord(data.goal)) return null

  const { id, name, createdAt, order } = data.goal
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof name !== 'string' ||
    !isGoalName(name) ||
    typeof createdAt !== 'string' ||
    Number.isNaN(new Date(createdAt).getTime()) ||
    typeof order !== 'number' ||
    !Number.isFinite(order)
  ) {
    return null
  }

  return { id, name, createdAt, order }
}
