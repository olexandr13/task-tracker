import { DEFAULT_QUIET_HOURS, isNudgeWindow, isQuietHours, type NudgeWindow, type StandingNudge } from '../core'
import { NUDGE_RESTING, type NudgeSetting } from './nudgeRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the nudge's setting. Its own version, apart from
 * everything else's; bump it whenever the shape below changes.
 *
 * Version 1 kept no hours to speak in (NUDGE-12): one saved then is read as any
 * hour, which is how the nudge arrives and what it did then.
 */
export const NUDGE_SCHEMA_VERSION = 2

export interface StoredNudge {
  version: number
  on: boolean
  quietHours: number
  window: { from: string; to: string } | null
  nudgedAt: string | null
  standing: { taskId: string; quietHours: number } | null
}

/** Whether the setting is exactly how the app arrives, and so worth saving nothing for. */
function isResting(setting: NudgeSetting): boolean {
  return (
    !setting.on &&
    setting.quietHours === NUDGE_RESTING.quietHours &&
    setting.window === null &&
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
    window: setting.window === null ? null : { from: setting.window.from, to: setting.window.to },
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
 * The saved hours in today's shape, none where there are none — a setting from
 * before there were hours (version 1) has none, as one saved without them does —
 * or `undefined` for something that is neither, which is not a setting to trust.
 *
 * Hours that cannot be read are not quietly taken as any hour: being nudged at
 * three in the morning is the one thing setting them asked against.
 */
function readWindow(data: unknown): NudgeWindow | null | undefined {
  if (data === null || data === undefined) return null
  return isNudgeWindow(data) ? { from: data.from, to: data.to } : undefined
}

/**
 * A saved setting in today's shape, or null when it cannot be trusted — an
 * unknown version, or anything that is not a setting. A span that is no longer
 * offered falls back to the default rather than throwing the rest away: the
 * owner asked to be nudged, and how often is the smaller half of that.
 */
export function readNudge(data: unknown): NudgeSetting | null {
  if (!isRecord(data) || (data.version !== NUDGE_SCHEMA_VERSION && data.version !== 1)) return null
  if (typeof data.on !== 'boolean') return null

  const nudgedAt = data.nudgedAt
  if (nudgedAt !== null && (typeof nudgedAt !== 'string' || Number.isNaN(Date.parse(nudgedAt)))) {
    return null
  }

  const window = readWindow(data.window)
  if (window === undefined) return null

  return {
    on: data.on,
    quietHours: isQuietHours(data.quietHours) ? data.quietHours : DEFAULT_QUIET_HOURS,
    window,
    nudgedAt,
    standing: readStanding(data.standing),
  }
}
