import type { HabitViewOptions } from './habitViewOptionsRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the habits view options. Its own version, apart from the
 * task view options and everything else: how habits fold has no reason to
 * change shape with them. Bump this whenever the shape below changes.
 */
export const HABIT_VIEW_OPTIONS_SCHEMA_VERSION = 2

export interface StoredHabitViewOptions {
  version: number
  options: HabitViewOptions
}

export function toStoredHabitViewOptions(options: HabitViewOptions): StoredHabitViewOptions {
  return { version: HABIT_VIEW_OPTIONS_SCHEMA_VERSION, options }
}

/**
 * Saved habits view options in today's shape, or null when they cannot be
 * trusted — an unknown version, or anything that is not shaped as it should be.
 */
export function readHabitViewOptions(data: unknown): HabitViewOptions | null {
  if (!isRecord(data) || data.version !== HABIT_VIEW_OPTIONS_SCHEMA_VERSION || !isRecord(data.options)) return null

  const { showDetails } = data.options
  if (typeof showDetails !== 'boolean') return null

  return { showDetails }
}
