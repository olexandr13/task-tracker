import { isLocalDay, type HabitRests, type RestLimit } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the habits' settings the account keeps (HAB-36): so far
 * the limit on rests alone. Its own version, apart from everything else's; bump
 * it whenever the shape below changes and migrate on load (STORE-5).
 */
export const HABIT_SETTINGS_SCHEMA_VERSION = 1

/** The one document the limit on rests is ever kept as, under this name. */
export const HABIT_RESTS = 'rests'

export interface StoredHabitRests {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof HABIT_RESTS
  /** The local day the limit was switched on, from which skips count against it. */
  since: string
}

/** What to save, or null for the limit off — no record at all is that. */
export function toStoredHabitRests(rests: HabitRests): StoredHabitRests | null {
  if (rests === null) return null
  return { version: HABIT_SETTINGS_SCHEMA_VERSION, name: HABIT_RESTS, since: rests.since }
}

/**
 * The saved limit in today's shape, or null when it cannot be trusted — an
 * unknown version, or anything that is not a record of it. Unreadable reads as
 * the limit off (STORE-7): every skip a rest, as the app was before it, rather
 * than streaks broken on a guess.
 */
export function readHabitRests(data: unknown): RestLimit | null {
  if (!isRecord(data) || data.version !== HABIT_SETTINGS_SCHEMA_VERSION) return null
  const { since } = data
  return typeof since === 'string' && isLocalDay(since) ? { since } : null
}
