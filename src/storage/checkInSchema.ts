import { isCheckInWindow } from '../core'
import { isCheckInOff, type CheckInPreference } from './checkInRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the check-in's setting (CHECKIN-2). Its own version, apart
 * from everything else's; bump it whenever the shape below changes and migrate
 * on load (STORE-5). The sender that pushes check-ins reads it too
 * (`functions/`), so a change of shape is a change there as well.
 */
export const CHECK_IN_SCHEMA_VERSION = 1

/** The one document the setting is ever kept as, under this name. */
export const CHECK_IN = 'checkIn'

export interface StoredCheckIn {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof CHECK_IN
  checkIn: { on: boolean; window: { from: string; to: string } }
}

/** What to save, or null for a check-in exactly as the app arrives — no record at all is that. */
export function toStoredCheckIn(preference: CheckInPreference): StoredCheckIn | null {
  if (isCheckInOff(preference)) return null

  return {
    version: CHECK_IN_SCHEMA_VERSION,
    name: CHECK_IN,
    checkIn: { on: preference.on, window: { from: preference.window.from, to: preference.window.to } },
  }
}

/**
 * A saved setting in today's shape, or null when it cannot be trusted — an
 * unknown version, or anything that is not a setting. Unreadable reads as the
 * check-in off (STORE-7): asking every hour is the one thing not to do on a
 * guess.
 */
export function readCheckIn(data: unknown): CheckInPreference | null {
  if (!isRecord(data) || data.version !== CHECK_IN_SCHEMA_VERSION || !isRecord(data.checkIn)) return null

  const { on, window } = data.checkIn
  if (typeof on !== 'boolean' || !isCheckInWindow(window)) return null
  return { on, window: { from: window.from, to: window.to } }
}
