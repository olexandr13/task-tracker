import type { WarmUp } from '../core'

/**
 * Where an account's warm-up (WARM-1) lives: the one day it began on, or
 * nothing at all when there is none.
 *
 * Kept in the account rather than on the device, unlike the settings that only
 * say how things are shown here (./deviceStorage): what a warm-up holds back is
 * the account's habits, so a phone and a laptop have to agree about the day it
 * is on and how many habits that allows. Every call site talks to this
 * interface rather than to the service behind it, as with the tasks
 * (./taskRepository).
 */
export interface WarmUpRepository {
  /**
   * Calls back with the warm-up once it is known, and again whenever it changes
   * — here, in another tab or on another device. Null is no warm-up. Returns
   * the way to stop.
   */
  subscribe(onWarmUp: (warmUp: WarmUp | null) => void, onError: (error: unknown) => void): () => void
  /** Starts a warm-up, or ends the one there is with null. */
  save(warmUp: WarmUp | null): Promise<void>
  /** Takes on a warm-up from elsewhere — the guest's, a backup file's — only where there is none already. */
  importWarmUp(warmUp: WarmUp): Promise<void>
}
