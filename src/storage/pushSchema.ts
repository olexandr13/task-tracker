import { isRecord } from './plainData'
import type { PushRegistration } from './pushRepository'

/**
 * The saved shape of a device's push registration (STORE-53). Its own version,
 * apart from everything else's; the sender (`functions/`) reads it too, so a
 * change of shape is a change there as well.
 */
export const PUSH_SCHEMA_VERSION = 1

export interface StoredPushRegistration {
  version: number
  deviceId: string
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  timeZone: string
  /** ISO 8601: when the device last said where it is. */
  updatedAt: string
}

/** A registration as the sender reads it: the device's own, and the hour it last pushed about. */
export interface SavedPushRegistration extends PushRegistration {
  readonly updatedAt: string
  /** The hour last pushed about (`slotKey`), written by the sender alone, or null. */
  readonly lastSentSlot: string | null
}

export function toStoredPushRegistration(registration: PushRegistration, now: Date): StoredPushRegistration {
  return {
    version: PUSH_SCHEMA_VERSION,
    deviceId: registration.deviceId,
    subscription: {
      endpoint: registration.subscription.endpoint,
      keys: { p256dh: registration.subscription.keys.p256dh, auth: registration.subscription.keys.auth },
    },
    timeZone: registration.timeZone,
    updatedAt: now.toISOString(),
  }
}

/** A saved registration, or null when it cannot be trusted — the sender then sends nothing to it. */
export function readPushRegistration(data: unknown): SavedPushRegistration | null {
  if (!isRecord(data) || data.version !== PUSH_SCHEMA_VERSION || !isRecord(data.subscription)) return null

  const { deviceId, timeZone, updatedAt, lastSentSlot } = data
  const { endpoint, keys } = data.subscription
  if (
    typeof deviceId !== 'string' ||
    deviceId === '' ||
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    !isRecord(keys) ||
    typeof keys.p256dh !== 'string' ||
    typeof keys.auth !== 'string' ||
    typeof timeZone !== 'string' ||
    timeZone === '' ||
    typeof updatedAt !== 'string'
  ) {
    return null
  }

  return {
    deviceId,
    subscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    timeZone,
    updatedAt,
    lastSentSlot: typeof lastSentSlot === 'string' ? lastSentSlot : null,
  }
}
