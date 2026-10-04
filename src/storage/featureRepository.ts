import type { FeaturesOff } from '../core'

/**
 * Where the switches on Settings are kept (FEAT-1): which features the account
 * has turned off.
 *
 * Kept in the account rather than on the device, as the modes are (MODE-9,
 * STORE-56): what someone uses the app for is theirs, not the machine's, so a
 * feature turned off at the laptop is off at the phone — and the sender that
 * pushes check-ins reads it there too (CHECKIN-10).
 *
 * Every call site talks to this interface rather than to the service behind it,
 * as with the tasks (./taskRepository).
 */
export interface FeatureRepository {
  /**
   * Calls back with the features switched off once that is known, and again
   * whenever it changes — here, in another tab or on another device. Null is
   * the app as it arrives, everything on. Returns the way to stop.
   */
  subscribe(onFeatures: (off: FeaturesOff | null) => void, onError: (error: unknown) => void): () => void
  /** Keeps the switches as they now stand; everything on keeps no record. */
  save(off: FeaturesOff): Promise<void>
  /** Takes on switches from elsewhere — the guest's, a backup file's — only where there are none already. */
  importFeatures(off: FeaturesOff): Promise<void>
}
