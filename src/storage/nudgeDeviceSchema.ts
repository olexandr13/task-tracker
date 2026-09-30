import { DEFAULT_QUIET_HOURS, isQuietHours, type StandingNudge } from '../core'
import { NUDGE_UNSPOKEN, type NudgeDeviceState } from './nudgeDeviceRepository'
import { isNudgeOff, type NudgePreference } from './nudgeRepository'
import { readNudgeWindow } from './nudgeSchema'
import { isRecord } from './plainData'

/**
 * The saved shape of what the nudge keeps on this device. Its own version,
 * apart from the account's setting (./nudgeSchema) and from everything else's;
 * bump it whenever the shape below changes and migrate on load (STORE-5).
 *
 * Versions 1 and 2 held the setting here too — whether the nudge was on, its
 * span, and from version 2 the hours to keep to — from before the setting
 * became the account's (STORE-46). Read here, only the two fields below are
 * taken; the setting in one of them is moved into the account once
 * (`readLegacyNudgePreference`) rather than lost.
 */
export const NUDGE_DEVICE_SCHEMA_VERSION = 3

/** The versions still readable, oldest first. */
const READABLE_VERSIONS = [1, 2, NUDGE_DEVICE_SCHEMA_VERSION]

export interface StoredNudgeDevice {
  version: number
  nudgedAt: string | null
  standing: { taskId: string; quietHours: number } | null
}

/** Whether this device has nothing to remember, and so nothing worth saving. */
function isUnspoken(state: NudgeDeviceState): boolean {
  return state.nudgedAt === null && state.standing === null
}

/** What to save: nothing while this device has never nudged and holds no notice. */
export function toStoredNudgeDevice(state: NudgeDeviceState): StoredNudgeDevice | null {
  if (isUnspoken(state)) return null

  return {
    version: NUDGE_DEVICE_SCHEMA_VERSION,
    nudgedAt: state.nudgedAt,
    standing: state.standing,
  }
}

/** A standing nudge in today's shape, or null — an unreadable one is simply not shown. */
function readStanding(data: unknown): StandingNudge | null {
  if (!isRecord(data)) return null
  if (typeof data.taskId !== 'string' || data.taskId === '') return null
  if (!isQuietHours(data.quietHours)) return null
  return { taskId: data.taskId, quietHours: data.quietHours }
}

/**
 * What this device saved, in today's shape, or null when it cannot be trusted —
 * an unknown version, or anything that is not a record of it. Unreadable reads
 * as nothing said here yet: the worst of it is one nudge sooner than it was due.
 */
export function readNudgeDevice(data: unknown): NudgeDeviceState | null {
  if (!isRecord(data) || typeof data.version !== 'number' || !READABLE_VERSIONS.includes(data.version)) return null

  const nudgedAt = data.nudgedAt
  if (nudgedAt !== null && (typeof nudgedAt !== 'string' || Number.isNaN(Date.parse(nudgedAt)))) {
    return NUDGE_UNSPOKEN
  }

  return { nudgedAt: nudgedAt ?? null, standing: readStanding(data.standing) }
}

/**
 * The setting saved here before the nudge became the account's (STORE-46), or
 * null where there is none to take — a record already in today's shape, one
 * that says nothing but the defaults, or one that cannot be read.
 *
 * Read once and moved into the account (`moveBrowserDataIn`), so a nudge turned
 * on in this browser stays on rather than quietly turning itself off the day
 * the setting learned to travel.
 */
export function readLegacyNudgePreference(data: unknown): NudgePreference | null {
  if (!isRecord(data) || (data.version !== 1 && data.version !== 2)) return null
  if (typeof data.on !== 'boolean') return null

  // Version 1 knew no hours to keep to, and spoke at whatever hour the quiet ran out.
  const window = data.version === 1 ? null : readNudgeWindow(data.window)
  if (window === undefined) return null

  const preference: NudgePreference = {
    on: data.on,
    quietHours: isQuietHours(data.quietHours) ? data.quietHours : DEFAULT_QUIET_HOURS,
    window,
  }
  return isNudgeOff(preference) ? null : preference
}
