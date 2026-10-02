import { CHEST_TIERS, isLocalDay, type ChestTier } from '../core'
import { CHEST_AT_REST, type ChestDeviceState } from './chestDeviceRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of what the chest keeps on this device. Its own version,
 * apart from the account's settings (./rewardSchema) and from everything
 * else's; bump it whenever the shape below changes and migrate on load
 * (STORE-5).
 */
export const CHEST_DEVICE_SCHEMA_VERSION = 1

export interface StoredChestDevice {
  version: number
  sound: boolean
  lastOpen: { day: string; tier: string } | null
  noticedDay: string | null
}

/** Whether this device has nothing to remember, and so nothing worth saving. */
function isAtRest(state: ChestDeviceState): boolean {
  return state.sound && state.lastOpen === null && state.noticedDay === null
}

/** What to save: nothing while the chest stands exactly as it arrives. */
export function toStoredChestDevice(state: ChestDeviceState): StoredChestDevice | null {
  if (isAtRest(state)) return null

  return {
    version: CHEST_DEVICE_SCHEMA_VERSION,
    sound: state.sound,
    lastOpen: state.lastOpen === null ? null : { day: state.lastOpen.day, tier: state.lastOpen.tier },
    noticedDay: state.noticedDay,
  }
}

function readDay(value: unknown): string | null {
  return typeof value === 'string' && isLocalDay(value) ? value : null
}

/** An opening in today's shape, or null — one that cannot be read simply does not glow. */
function readLastOpen(data: unknown): { day: string; tier: ChestTier } | null {
  if (!isRecord(data)) return null

  const day = readDay(data.day)
  if (day === null) return null
  if (typeof data.tier !== 'string' || !(CHEST_TIERS as readonly string[]).includes(data.tier)) return null

  return { day, tier: data.tier as ChestTier }
}

/**
 * What this device saved, in today's shape, or null when it cannot be trusted —
 * an unknown version, or anything that is not a record of it. Unreadable reads
 * as a device arriving: the worst of it is a noise nobody asked for twice, and a
 * notice said once more than it had to be.
 */
export function readChestDevice(data: unknown): ChestDeviceState | null {
  if (!isRecord(data) || data.version !== CHEST_DEVICE_SCHEMA_VERSION) return null
  if (typeof data.sound !== 'boolean') return CHEST_AT_REST

  return {
    sound: data.sound,
    lastOpen: readLastOpen(data.lastOpen),
    noticedDay: readDay(data.noticedDay),
  }
}
