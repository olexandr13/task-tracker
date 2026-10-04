import { CASE_QUARTERS, isLocalDay, type CaseQuarter } from '../core'
import { CASES_AT_REST, type CaseDeviceState } from './caseDeviceRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of what Cases keeps on this device. Its own version,
 * apart from the account's settings (./rewardSchema) and from everything
 * else's; bump it whenever the shape below changes and migrate on load
 * (STORE-5).
 *
 * 2: the last opening is remembered by which quarter of the jackpot it came to
 * rather than by its tier, the tiers having gone. A version 1 record keeps its
 * sound and its notice and forgets the opening — an old tier says nothing about
 * a quarter, and the worst of forgetting is today's card shown in plain bone.
 * 3: the day this device already said Weekly was here. A record from before
 * that has not said it.
 */
export const CASE_DEVICE_SCHEMA_VERSION = 3

export interface StoredCaseDevice {
  version: number
  sound: boolean
  lastOpen: { day: string; quarter: number } | null
  noticedDay: string | null
  noticedWeek: string | null
}

/** Whether this device has nothing to remember, and so nothing worth saving. */
function isAtRest(state: CaseDeviceState): boolean {
  return state.sound && state.lastOpen === null && state.noticedDay === null && state.noticedWeek === null
}

/** What to save: nothing while Cases stands exactly as it arrives. */
export function toStoredCaseDevice(state: CaseDeviceState): StoredCaseDevice | null {
  if (isAtRest(state)) return null

  return {
    version: CASE_DEVICE_SCHEMA_VERSION,
    sound: state.sound,
    lastOpen: state.lastOpen === null ? null : { day: state.lastOpen.day, quarter: state.lastOpen.quarter },
    noticedDay: state.noticedDay,
    noticedWeek: state.noticedWeek,
  }
}

function readDay(value: unknown): string | null {
  return typeof value === 'string' && isLocalDay(value) ? value : null
}

/** An opening in today's shape, or null — one that cannot be read simply does not glow. */
function readLastOpen(data: unknown): { day: string; quarter: CaseQuarter } | null {
  if (!isRecord(data)) return null

  const day = readDay(data.day)
  if (day === null) return null
  if (typeof data.quarter !== 'number' || !(CASE_QUARTERS as readonly number[]).includes(data.quarter)) return null

  return { day, quarter: data.quarter as CaseQuarter }
}

/**
 * What this device saved, in today's shape, or null when it cannot be trusted —
 * an unknown version, or anything that is not a record of it. Unreadable reads
 * as a device arriving: the worst of it is a noise nobody asked for twice, and a
 * notice said once more than it had to be.
 */
export function readCaseDevice(data: unknown): CaseDeviceState | null {
  if (!isRecord(data) || (data.version !== 1 && data.version !== 2 && data.version !== CASE_DEVICE_SCHEMA_VERSION)) return null
  if (typeof data.sound !== 'boolean') return CASES_AT_REST

  return {
    sound: data.sound,
    lastOpen: data.version === 1 ? null : readLastOpen(data.lastOpen),
    noticedDay: readDay(data.noticedDay),
    noticedWeek: data.version === CASE_DEVICE_SCHEMA_VERSION ? readDay(data.noticedWeek) : null,
  }
}
