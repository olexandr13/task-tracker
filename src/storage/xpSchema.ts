import { isLocalDay, isXpAmount, type LocalDay, type XpProgress } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of where XP stands (LVL-1). Its own version, apart from
 * everything else's; bump it whenever the shape below changes, and upgrade on
 * reading (STORE-5).
 *
 * - 1: a ledger of every record XP was given or taken for, a day at a time in
 *   `xpDays`, and beside it only the day XP began and the last day counted,
 *   under `start`.
 * - 2: where it stands and nothing else, under `progress`: the XP in all, the
 *   day it began, the last day counted, and today's tasks added. Version 1 is
 *   moved into it once (`migrateLegacyXp`): its records added up, from the day
 *   it began.
 */
export const XP_SCHEMA_VERSION = 2

/** The one document where XP stands is ever kept as, under this name. */
export const XP_PROGRESS = 'progress'

/** Where version 1 kept the day XP began, beside its ledger. */
export const LEGACY_XP_START = 'start'

export interface StoredXpProgress {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof XP_PROGRESS
  xp: number
  startedOn: LocalDay
  settledThrough: LocalDay | null
  addsOn: LocalDay | null
  adds: number
}

export function toStoredXpProgress(progress: XpProgress): StoredXpProgress {
  return {
    version: XP_SCHEMA_VERSION,
    name: XP_PROGRESS,
    xp: progress.xp,
    startedOn: progress.startedOn,
    settledThrough: progress.settledThrough,
    addsOn: progress.addsOn,
    adds: progress.adds,
  }
}

function isDayOrNull(value: unknown): value is LocalDay | null {
  return value === null || (typeof value === 'string' && isLocalDay(value))
}

/** Where XP stands, or null when it cannot be trusted — which reads as XP not begun yet. */
export function readXpProgress(data: unknown): XpProgress | null {
  if (!isRecord(data) || data.version !== XP_SCHEMA_VERSION) return null

  const { xp, startedOn } = data
  const settledThrough = data.settledThrough ?? null
  const addsOn = data.addsOn ?? null
  const adds = data.adds ?? 0
  if (
    !isXpAmount(xp) ||
    typeof startedOn !== 'string' ||
    !isLocalDay(startedOn) ||
    !isDayOrNull(settledThrough) ||
    !isDayOrNull(addsOn) ||
    !isXpAmount(adds) ||
    adds < 0
  ) {
    return null
  }
  return { xp, startedOn, settledThrough, addsOn, adds }
}

/** Version 1's start: the day XP began and the last day counted, or null when it cannot be read. */
export interface LegacyXpStart {
  readonly startedOn: LocalDay
  readonly settledThrough: LocalDay | null
}

export function readLegacyXpStart(data: unknown): LegacyXpStart | null {
  if (!isRecord(data) || data.version !== 1) return null
  const { startedOn } = data
  const settledThrough = data.settledThrough ?? null
  if (typeof startedOn !== 'string' || !isLocalDay(startedOn) || !isDayOrNull(settledThrough)) return null
  return { startedOn, settledThrough }
}

/** What one of version 1's records gave, on its day. */
export interface LegacyXp {
  readonly day: LocalDay
  readonly xp: number
}

/** What a day of version 1's ledger holds, record by record; nothing for a day that cannot be read. */
export function readLegacyXpDay(data: unknown): LegacyXp[] {
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.records)) return []
  const { day } = data
  if (typeof day !== 'string' || !isLocalDay(day)) return []
  return Object.values(data.records).flatMap((fields) =>
    isRecord(fields) && isXpAmount(fields.xp) ? [{ day, xp: fields.xp }] : [],
  )
}

/** One of version 1's records as the guest's browser kept it, or null. */
export function readLegacyXpRecord(data: unknown): LegacyXp | null {
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.record)) return null
  const { day, xp } = data.record
  return typeof day === 'string' && isLocalDay(day) && isXpAmount(xp) ? { day, xp } : null
}

/**
 * Version 1 moved into where XP stands: its records from the day it began on,
 * added up — the history let go of, the XP kept.
 */
export function migrateLegacyXp(start: LegacyXpStart, records: readonly LegacyXp[]): XpProgress {
  const xp = records.reduce((sum, record) => sum + (record.day >= start.startedOn ? record.xp : 0), 0)
  return { xp, startedOn: start.startedOn, settledThrough: start.settledThrough, addsOn: null, adds: 0 }
}
