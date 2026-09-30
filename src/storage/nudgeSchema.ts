import { DEFAULT_QUIET_HOURS, isNudgeWindow, isQuietHours, type NudgeWindow } from '../core'
import { isNudgeOff, type NudgePreference } from './nudgeRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the nudge's setting (NUDGE-9). Its own version, apart from
 * everything else's; bump it whenever the shape below changes and migrate on
 * load (STORE-5).
 *
 * The setting the app kept on the device before it was the account's has a
 * shape and a version of its own (./nudgeDeviceSchema), and is moved in once
 * rather than read here.
 */
export const NUDGE_SCHEMA_VERSION = 1

/** The one document the setting is ever kept as, under this name. */
export const NUDGE = 'nudge'

export interface StoredNudge {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof NUDGE
  nudge: { on: boolean; quietHours: number; window: { from: string; to: string } | null }
}

/**
 * What to save, or null for a nudge exactly as the app arrives — no record at
 * all is off at its defaults, as no record is no warm-up (./warmUpSchema).
 */
export function toStoredNudge(preference: NudgePreference): StoredNudge | null {
  if (isNudgeOff(preference)) return null

  return {
    version: NUDGE_SCHEMA_VERSION,
    name: NUDGE,
    nudge: {
      on: preference.on,
      quietHours: preference.quietHours,
      window: preference.window === null ? null : { from: preference.window.from, to: preference.window.to },
    },
  }
}

/**
 * The saved hours in today's shape, none where there are none, or `undefined`
 * for something that is neither — which is not a setting to trust.
 *
 * Hours that cannot be read are not quietly taken as any hour: being nudged at
 * three in the morning is the one thing setting them asked against.
 */
export function readNudgeWindow(data: unknown): NudgeWindow | null | undefined {
  if (data === null || data === undefined) return null
  return isNudgeWindow(data) ? { from: data.from, to: data.to } : undefined
}

/**
 * A saved setting in today's shape, or null when it cannot be trusted — an
 * unknown version, or anything that is not a setting. Unreadable reads as the
 * nudge off (STORE-7). A span that is no longer offered falls back to the
 * default rather than throwing the rest away: the owner asked to be nudged, and
 * how long for is the smaller half of that.
 */
export function readNudge(data: unknown): NudgePreference | null {
  if (!isRecord(data) || data.version !== NUDGE_SCHEMA_VERSION) return null
  if (!isRecord(data.nudge)) return null

  const { on, quietHours } = data.nudge
  if (typeof on !== 'boolean') return null

  const window = readNudgeWindow(data.nudge.window)
  if (window === undefined) return null

  return { on, quietHours: isQuietHours(quietHours) ? quietHours : DEFAULT_QUIET_HOURS, window }
}
