import { isLocalDay, type WarmUp } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the warm-up (WARM-1). Its own version, apart from
 * everything else's; bump it whenever the shape below changes and migrate on
 * load (STORE-5).
 */
export const WARM_UP_SCHEMA_VERSION = 1

/** The one document the warm-up is kept as, under this name. */
export const WARM_UP = 'warmUp'

export interface StoredWarmUp {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof WARM_UP
  warmUp: { startedOn: string }
}

export function toStoredWarmUp(warmUp: WarmUp): StoredWarmUp {
  return {
    version: WARM_UP_SCHEMA_VERSION,
    name: WARM_UP,
    warmUp: { startedOn: warmUp.startedOn },
  }
}

/**
 * A saved warm-up in today's shape, or null when it cannot be trusted — an
 * unknown version, a day that is no day, or anything that is not a warm-up.
 * Unreadable reads as none at all, which asks nothing of anyone (STORE-7);
 * a warm-up is a month of encouragement, not a record worth guessing at.
 */
export function readWarmUp(data: unknown): WarmUp | null {
  if (!isRecord(data) || data.version !== WARM_UP_SCHEMA_VERSION) return null
  if (!isRecord(data.warmUp)) return null

  const startedOn = data.warmUp.startedOn
  if (typeof startedOn !== 'string' || !isLocalDay(startedOn)) return null

  return { startedOn }
}
