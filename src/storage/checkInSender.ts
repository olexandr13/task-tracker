import {
  ALL_FEATURES_ON,
  checkInSlotToSend,
  isModeAvailable,
  isSlotLogged,
  slotKey,
  wallClock,
  type ActivityEntry,
  type HourSlot,
} from '../core'
import { readActivityDay } from './activitySchema'
import { readCheckIn } from './checkInSchema'
import { readFeatures } from './featureSchema'
import type { PushSubscriptionData } from './pushRepository'
import { readPushRegistration, type SavedPushRegistration } from './pushSchema'

/**
 * The sender: what pushes a check-in to a device while the app is closed
 * (CHECKIN-10). It runs on a schedule, every quarter of an hour, in the
 * project's Firebase functions (`functions/`), not in the app — this is the
 * part of it that decides, kept beside the shapes it reads so the two cannot
 * drift apart, and handed what it reads and sends through so it can be tested.
 *
 * For every device registered, in the device's own time zone: the account has
 * the check-in on, and the modes and the activity log it belongs to switched
 * on as well (FEAT-9), the hour that just ended is one it keeps to, it is still
 * early in the next hour, nothing is logged under it yet, and it was not pushed
 * about already. Then it is pushed, and the hour is written down beside the
 * registration. A device the push service no longer knows is let go of.
 */

/** What a check-in says, pushed: shown by the service worker as it is (`public/check-in-sw.js`). */
export interface CheckInPush {
  readonly title: string
  readonly body: string
  /** One notification per hour: a second for the same hour replaces the first. */
  readonly tag: string
  /** Where the app opens when it is pressed with no window open. */
  readonly url: string
  /** The hour asked about, for an open window to go to; null for a test. */
  readonly slot: HourSlot | null
}

/** What the sender reads and writes, in the account's own documents. */
export interface SenderStore {
  /** Every device registered, in every account: its account, its id, and what it was saved as. */
  registrations(): Promise<readonly { readonly accountId: string; readonly deviceId: string; readonly data: unknown }[]>
  /** The account's check-in setting as saved, or undefined where there is none. */
  checkIn(accountId: string): Promise<unknown>
  /** The account's feature switches as saved (FEAT-1), or undefined where there are none. */
  features(accountId: string): Promise<unknown>
  /** A day of the account's activity log as saved, or undefined where there is none. */
  activityDay(accountId: string, day: string): Promise<unknown>
  /** Writes down the hour last pushed about beside the registration. */
  markSent(accountId: string, deviceId: string, slot: string): Promise<void>
  /** Lets a registration go. */
  forget(accountId: string, deviceId: string): Promise<void>
}

/** What a push came to: sent, or the push service saying the device has gone. */
export type PushResult = 'sent' | 'gone'

export type SendPush = (subscription: PushSubscriptionData, push: CheckInPush) => Promise<PushResult>

/** What one run came to, for the sender's log. */
export interface SenderRun {
  readonly sent: number
  readonly forgotten: number
}

function onTheHour(hour: number): string {
  return `${String(hour % 24).padStart(2, '0')}:00`
}

/** The check-in asked about an hour, as the app asks it (`describeCheckInQuestion`). */
export function checkInPush(slot: HourSlot): CheckInPush {
  return {
    title: `What did you do ${onTheHour(slot.hour)}–${onTheHour(slot.hour + 1)}?`,
    body: 'Tap to log it in PickMe.',
    tag: `check-in-${slotKey(slot)}`,
    url: '/#/activity',
    slot,
  }
}

/** The test pushed when asked for on the mode's page (CHECKIN-12). */
export const TEST_PUSH: CheckInPush = {
  title: 'Check-in is set up',
  body: 'This is how check-ins reach this device, even with PickMe closed.',
  tag: 'check-in-test',
  url: '/#/activity',
  slot: null,
}

interface Device {
  readonly accountId: string
  readonly registration: SavedPushRegistration
}

/**
 * The registrations worth sending to: those that can be read, and of two that
 * share an endpoint — a browser signed out of one account and into another
 * without the first letting go — only the one saved last. The rest are
 * returned to be let go of.
 */
export function devicesToReach(
  saved: readonly { readonly accountId: string; readonly deviceId: string; readonly data: unknown }[],
): { readonly reach: readonly Device[]; readonly stale: readonly { readonly accountId: string; readonly deviceId: string }[] } {
  const byEndpoint = new Map<string, Device>()
  const stale: { accountId: string; deviceId: string }[] = []

  for (const { accountId, deviceId, data } of saved) {
    const registration = readPushRegistration(data)
    if (registration === null) continue
    const device = { accountId, registration: { ...registration, deviceId } }
    const other = byEndpoint.get(registration.subscription.endpoint)
    if (other === undefined) {
      byEndpoint.set(registration.subscription.endpoint, device)
    } else if (other.registration.updatedAt < registration.updatedAt) {
      stale.push({ accountId: other.accountId, deviceId: other.registration.deviceId })
      byEndpoint.set(registration.subscription.endpoint, device)
    } else {
      stale.push({ accountId, deviceId })
    }
  }

  return { reach: [...byEndpoint.values()], stale }
}

/** One run of the sender at `now` (CHECKIN-10). */
export async function sendDueCheckIns(store: SenderStore, send: SendPush, now: Date): Promise<SenderRun> {
  const { reach, stale } = devicesToReach(await store.registrations())
  let sent = 0
  let forgotten = 0

  for (const { accountId, deviceId } of stale) {
    await store.forget(accountId, deviceId)
    forgotten += 1
  }

  const settings = new Map<string, ReturnType<typeof readCheckIn>>()
  const available = new Map<string, boolean>()
  const days = new Map<string, ActivityEntry[] | null>()

  for (const { accountId, registration } of reach) {
    if (!settings.has(accountId)) {
      const saved = await store.checkIn(accountId)
      settings.set(accountId, saved === undefined ? null : readCheckIn(saved))
    }
    const preference = settings.get(accountId) ?? null
    if (preference === null || !preference.on) continue

    // A check-in switched away with the modes or the log (FEAT-9) asks nothing,
    // its own switch left as it was for when they come back. Switches that
    // cannot be read are everything on, as the app reads them (STORE-56).
    if (!available.has(accountId)) {
      const saved = await store.features(accountId)
      const off = saved === undefined ? ALL_FEATURES_ON : (readFeatures(saved) ?? ALL_FEATURES_ON)
      available.set(accountId, isModeAvailable(off, 'checkIn'))
    }
    if (available.get(accountId) !== true) continue

    const clock = wallClock(now, registration.timeZone)
    if (clock === null) continue
    const slot = checkInSlotToSend({
      on: preference.on,
      window: preference.window,
      clock,
      lastSentSlot: registration.lastSentSlot,
    })
    if (slot === null) continue

    const dayKey = `${accountId}/${slot.day}`
    if (!days.has(dayKey)) {
      const saved = await store.activityDay(accountId, slot.day)
      days.set(dayKey, saved === undefined ? [] : readActivityDay(saved))
    }
    const entries = days.get(dayKey) ?? null
    // A day that cannot be read says nothing about what is logged under it; ask nothing rather than guess.
    if (entries === null || isSlotLogged(entries, slot)) continue

    if ((await send(registration.subscription, checkInPush(slot))) === 'gone') {
      await store.forget(accountId, registration.deviceId)
      forgotten += 1
      continue
    }
    await store.markSent(accountId, registration.deviceId, slotKey(slot))
    sent += 1
  }

  return { sent, forgotten }
}
