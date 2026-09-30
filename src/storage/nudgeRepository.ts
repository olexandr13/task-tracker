import { DEFAULT_QUIET_HOURS, type NudgeWindow, type QuietHours } from '../core'

/**
 * The nudge as the owner asked for it: whether it is on, how long a quiet
 * stretch it waits for, and the hours of the day it may speak in.
 *
 * Kept in the account rather than on the device, as the other modes are
 * (MODE-9, STORE-46): how someone wants to be nudged is theirs and not the
 * machine's, so a span set at the laptop is the span at the phone. What each
 * device still keeps to itself is only what it alone can answer — whether *it*
 * has already said this (./nudgeDeviceRepository).
 *
 * Every call site talks to this interface rather than to the service behind it,
 * as with the tasks (./taskRepository).
 */
export interface NudgePreference {
  readonly on: boolean
  /** How long of nothing finished before it says something (NUDGE-1). */
  readonly quietHours: QuietHours
  /** The hours of the day it may speak in, or null for any hour (NUDGE-12). */
  readonly window: NudgeWindow | null
}

/** Off, at the default span, at any hour — how the app arrives. */
export const NUDGE_OFF: NudgePreference = {
  on: false,
  quietHours: DEFAULT_QUIET_HOURS,
  window: null,
}

/**
 * Whether the nudge is exactly how the app arrives, and so worth keeping no
 * record for: no record at all is the nudge off at its defaults, whether it was
 * never on or was turned off without anything being tuned.
 */
export function isNudgeOff(preference: NudgePreference): boolean {
  return !preference.on && preference.quietHours === NUDGE_OFF.quietHours && preference.window === null
}

/** Where the nudge's setting lives: in the account, as the other modes do (STORE-46). */
export interface NudgeRepository {
  /**
   * Calls back with the setting once it is known, and again whenever it changes
   * — here, in another tab or on another device. Null is the nudge as it
   * arrives (`NUDGE_OFF`). Returns the way to stop.
   */
  subscribe(
    onPreference: (preference: NudgePreference | null) => void,
    onError: (error: unknown) => void,
  ): () => void
  /** Keeps the setting as it now stands; one back at its defaults keeps no record. */
  save(preference: NudgePreference): Promise<void>
  /** Takes on a setting from elsewhere — the guest's, a backup file's, this browser's from before it synced — only where there is none already. */
  importNudge(preference: NudgePreference): Promise<void>
}
