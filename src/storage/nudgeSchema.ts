import { DEFAULT_QUIET_HOURS, isQuietHours, type StandingNudge } from '../core'
import { NUDGE_RESTING, type NudgeSetting } from './nudgeRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the nudge's setting. Its own version, apart from
 * everything else's; bump it whenever the shape below changes.
 */
export const NUDGE_SCHEMA_VERSION = 1

export interface StoredNudge {
  version: number
  on: boolean
  quietHours: number
  nudgedAt: string | null
  standing: { taskId: string; quietHours: number } | null
}

/** Whether the setting is exactly how the app arrives, and so worth saving nothing for. */
function isResting(setting: NudgeSetting): boolean {
  return (
    !setting.on &&
    setting.quietHours === NUDGE_RESTING.quietHours &&
    setting.nudgedAt === null &&
    setting.standing === null
  )
}

/** What to save: nothing while the nudge is off and has never fired. */
export function toStoredNudge(setting: NudgeSetting): StoredNudge | null {
  if (isResting(setting)) return null

  return {
    version: NUDGE_SCHEMA_VERSION,
    on: setting.on,
    quietHours: setting.quietHours,
    nudgedAt: setting.nudgedAt,
    standing: setting.standing,
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
 * A saved setting in today's shape, or null when it cannot be trusted — an
 * unknown version, or anything that is not a setting. A span that is no longer
 * offered falls back to the default rather than throwing the rest away: the
 * owner asked to be nudged, and how often is the smaller half of that.
 */
export function readNudge(data: unknown): NudgeSetting | null {
  if (!isRecord(data) || data.version !== NUDGE_SCHEMA_VERSION) return null
  if (typeof data.on !== 'boolean') return null

  const nudgedAt = data.nudgedAt
  if (nudgedAt !== null && (typeof nudgedAt !== 'string' || Number.isNaN(Date.parse(nudgedAt)))) {
    return null
  }

  return {
    on: data.on,
    quietHours: isQuietHours(data.quietHours) ? data.quietHours : DEFAULT_QUIET_HOURS,
    nudgedAt,
    standing: readStanding(data.standing),
  }
}
