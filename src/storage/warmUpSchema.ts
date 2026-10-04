import { isLocalDay, type WarmUp } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of the warm-up (WARM-1). Its own version, apart from
 * everything else's; bump it whenever the shape below changes and migrate on
 * load (STORE-5).
 *
 * Version 1 held the day it began and nothing else: a warm-up saved then is
 * read as running, which is the only way one could be (WARM-11).
 */
export const WARM_UP_SCHEMA_VERSION = 2

/** The one document the warm-up is kept as, under this name. */
export const WARM_UP = 'warmUp'

export interface StoredWarmUp {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof WARM_UP
  warmUp: { startedOn: string; pausedOn: string | null; pausedDays: number }
}

export function toStoredWarmUp(warmUp: WarmUp): StoredWarmUp {
  return {
    version: WARM_UP_SCHEMA_VERSION,
    name: WARM_UP,
    warmUp: {
      startedOn: warmUp.startedOn,
      pausedOn: warmUp.pausedOn,
      pausedDays: warmUp.pausedDays,
    },
  }
}

/**
 * A saved warm-up in today's shape, or null when it cannot be trusted — an
 * unknown version, a day that is no day, or anything that is not a warm-up.
 * Unreadable reads as none at all, which asks nothing of anyone (STORE-7);
 * a warm-up is a month of encouragement, not a record worth guessing at.
 * Version 1, from before a warm-up could be paused, is read as not paused.
 */
export function readWarmUp(data: unknown): WarmUp | null {
  if (!isRecord(data) || (data.version !== 1 && data.version !== WARM_UP_SCHEMA_VERSION)) return null
  if (!isRecord(data.warmUp)) return null

  const startedOn = data.warmUp.startedOn
  if (typeof startedOn !== 'string' || !isLocalDay(startedOn)) return null
  if (data.version === 1) return { startedOn, pausedOn: null, pausedDays: 0 }

  return readPaused(startedOn, data.warmUp.pausedOn, data.warmUp.pausedDays)
}

function readPaused(startedOn: string, pausedOn: unknown, pausedDays: unknown): WarmUp | null {
  if (pausedOn !== null && (typeof pausedOn !== 'string' || !isLocalDay(pausedOn))) return null
  if (typeof pausedDays !== 'number' || !Number.isSafeInteger(pausedDays) || pausedDays < 0) return null
  return { startedOn, pausedOn, pausedDays }
}
