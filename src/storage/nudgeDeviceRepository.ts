import type { StandingNudge } from '../core'

/**
 * What the nudge keeps on this device: when it last said something here, and
 * the notice it said that has not been answered yet.
 *
 * The setting itself is the account's (./nudgeRepository, STORE-46) — a span
 * and the hours to keep to are how the owner wants to be nudged, wherever they
 * are. This is the half only the device can answer: whether *it* has already
 * spoken. A nudge on the laptop is not repeated on the phone, which has its own
 * (NUDGE-6).
 */
export interface NudgeDeviceState {
  /** ISO 8601 when this device last nudged, or null for never. */
  readonly nudgedAt: string | null
  /**
   * The nudge shown here and not yet answered, or null for none. Kept rather
   * than held on screen alone: a nudge that has spent its quiet stretch
   * (NUDGE-6) must not be lost to a refresh or a remount without ever being seen.
   */
  readonly standing: StandingNudge | null
}

/** Nothing said here yet, and nothing standing — how a device arrives. */
export const NUDGE_UNSPOKEN: NudgeDeviceState = { nudgedAt: null, standing: null }

/** Where this device's half of the nudge is kept between visits. */
export interface NudgeDeviceRepository {
  load(): NudgeDeviceState
  save(state: NudgeDeviceState): void
}
