import { DEFAULT_CHECK_IN_WINDOW, type HoursWindow } from '../core'

/**
 * The check-in as the owner asked for it: whether it is on, and the hours of
 * the day it asks about (CHECKIN-2).
 *
 * Kept in the account rather than on the device, as every mode is (MODE-9):
 * the hours are the owner's, so they are the same at the laptop and the phone.
 * What each device keeps to itself is only what it alone can answer
 * (./checkInDeviceRepository).
 */
export interface CheckInPreference {
  readonly on: boolean
  /** The hours asked about, whole hours, From to To. Kept while off, and read by the log (ACT-17). */
  readonly window: HoursWindow
}

/** Off, 09:00–22:00 — how the app arrives. */
export const CHECK_IN_OFF: CheckInPreference = { on: false, window: DEFAULT_CHECK_IN_WINDOW }

/** Whether the check-in is exactly how the app arrives, and so worth keeping no record for. */
export function isCheckInOff(preference: CheckInPreference): boolean {
  return (
    !preference.on && preference.window.from === CHECK_IN_OFF.window.from && preference.window.to === CHECK_IN_OFF.window.to
  )
}

/** Where the check-in's setting lives: in the account (STORE-52). */
export interface CheckInRepository {
  /**
   * Calls back with the setting once it is known, and again whenever it
   * changes. Null is the check-in as it arrives (`CHECK_IN_OFF`). Returns the
   * way to stop.
   */
  subscribe(
    onPreference: (preference: CheckInPreference | null) => void,
    onError: (error: unknown) => void,
  ): () => void
  /** Keeps the setting as it now stands; one back at its defaults keeps no record. */
  save(preference: CheckInPreference): Promise<void>
  /** Takes on a setting from elsewhere — the guest's, a backup file's — only where there is none already. */
  importCheckIn(preference: CheckInPreference): Promise<void>
}
