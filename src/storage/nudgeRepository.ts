import { DEFAULT_QUIET_HOURS, type NudgeWindow, type QuietHours, type StandingNudge } from '../core'

/**
 * The nudge as this device has it: whether it is on, how long a quiet stretch
 * it waits for, the hours it may say it in, and when it last said something.
 *
 * Kept on this device rather than in the account (STORE-30): the browser is
 * what allows notifications, so being nudged on the laptop is not being nudged
 * on the phone. `nudgedAt` rides along with the setting because it answers a
 * question only this device can — whether *it* has already said this.
 */
export interface NudgeSetting {
  readonly on: boolean
  readonly quietHours: QuietHours
  /**
   * The hours of the day it may speak in, or null for any hour — which is how it
   * arrives (NUDGE-12). The hours are the device's along with the rest of the
   * setting, and so in the device's own clock.
   */
  readonly window: NudgeWindow | null
  /** ISO 8601 when this device last nudged, or null for never. */
  readonly nudgedAt: string | null
  /**
   * The nudge shown and not yet answered, or null for none. Kept rather than
   * held on screen alone: a nudge that has spent its quiet stretch (NUDGE-6)
   * must not be lost to a refresh or a remount without ever being seen.
   */
  readonly standing: StandingNudge | null
}

/** Off, at the default span, at any hour, never yet shown — how the app arrives. */
export const NUDGE_RESTING: NudgeSetting = {
  on: false,
  quietHours: DEFAULT_QUIET_HOURS,
  window: null,
  nudgedAt: null,
  standing: null,
}

/** Where the nudge's setting is kept between visits on this device. */
export interface NudgeRepository {
  load(): NudgeSetting
  save(setting: NudgeSetting): void
}
