import type { HabitRests, RestLimit } from '../core'

/**
 * Where the habits' settings the account keeps are kept: so far the limit on
 * rests (HAB-36, STORE-63).
 *
 * Kept in the account rather than on the device, as the feature switches are
 * (STORE-56): whether a skip has to be paid for with a rest changes what the
 * streaks say, and a streak should say the same at the laptop and the phone.
 *
 * Every call site talks to this interface rather than to the service behind it,
 * as with the tasks (./taskRepository).
 */
export interface HabitSettingsRepository {
  /**
   * Calls back with the limit on rests once it is known, and again whenever it
   * changes — here, in another tab or on another device. Null is the limit off.
   * Returns the way to stop.
   */
  subscribe(onRests: (rests: HabitRests) => void, onError: (error: unknown) => void): () => void
  /** Keeps the limit as it now stands; off keeps no record. */
  save(rests: HabitRests): Promise<void>
  /** Takes on a limit from elsewhere — the guest's, a backup file's — only where there is none already. */
  importRests(rests: RestLimit): Promise<void>
}
