import type { ProcrastinationState } from '../core'

/**
 * Where Procrastination mode (JUST-10) lives: the one task in front of you
 * today, or nothing at all while the mode is off.
 *
 * Kept in the account rather than on the device, as the warm-up is
 * (./warmUpRepository): a mode is on for the person, not for the machine they
 * happened to turn it on at, so the phone and the laptop show the same one task
 * (STORE-45). Every call site talks to this interface rather than to the
 * service behind it, as with the tasks (./taskRepository).
 */
export interface ProcrastinationRepository {
  /**
   * Calls back with the mode once it is known, and again whenever it changes —
   * here, in another tab or on another device. Null is off. Returns the way to
   * stop.
   */
  subscribe(
    onState: (state: ProcrastinationState | null) => void,
    onError: (error: unknown) => void,
  ): () => void
  /** Keeps the mode as it now stands, or turns it off with null. */
  save(state: ProcrastinationState | null): Promise<void>
}
