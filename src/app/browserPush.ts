import type { PushSubscriptionData } from '../storage/pushRepository'

/**
 * The browser's push subscription — what lets the sender reach a device while
 * the app is closed (CHECKIN-10) — and whether this browser can have one.
 *
 * A push is received by the service worker, which only the built app has
 * (`public/check-in-sw.js`, imported into the worker `vite.config.ts` makes);
 * the development server has none, and says so rather than failing.
 */

/** Whether this browser can be pushed check-ins, and where not, what stands in the way. */
export type PushSupport = 'supported' | 'not-set-up' | 'no-worker' | 'install-first' | 'unsupported'

/** The public half of the sender's key, from `VITE_VAPID_PUBLIC_KEY`; empty where it is not set. */
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

/** An iPhone or iPad, where push reaches only an app added to the Home Screen. */
function isAppleTouchDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export async function pushSupport(publicKey: string = VAPID_PUBLIC_KEY): Promise<PushSupport> {
  if (publicKey === '') return 'not-set-up'
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported'
  if (!('PushManager' in window)) return isAppleTouchDevice() && !isInstalled() ? 'install-first' : 'unsupported'

  try {
    return (await navigator.serviceWorker.getRegistration()) === undefined ? 'no-worker' : 'supported'
  } catch {
    return 'unsupported'
  }
}

/** The key as the push manager wants it: raw bytes, from the URL-safe base64 it is written in. */
function keyBytes(publicKey: string): Uint8Array<ArrayBuffer> {
  const base64 = publicKey.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(publicKey.length / 4) * 4, '=')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

function sameKey(key: ArrayBuffer | null, wanted: Uint8Array): boolean {
  if (key === null || key.byteLength !== wanted.length) return false
  const bytes = new Uint8Array(key)
  return bytes.every((byte, index) => byte === wanted[index])
}

/**
 * This browser's push subscription, made if there is none — or made again
 * where the one there was made for another key. Throws where the browser
 * refuses, as it does without permission to notify.
 */
export async function subscribeToPush(publicKey: string = VAPID_PUBLIC_KEY): Promise<PushSubscriptionData> {
  const registration = await navigator.serviceWorker.ready
  const wanted = keyBytes(publicKey)
  let subscription = await registration.pushManager.getSubscription()
  if (subscription !== null && !sameKey(subscription.options.applicationServerKey, wanted)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: wanted })

  const { endpoint, keys } = subscription.toJSON()
  if (endpoint === undefined || keys?.p256dh === undefined || keys.auth === undefined) {
    throw new Error('The browser made a push subscription without its keys.')
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

/** Lets this browser's push subscription go, where there is one. */
export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  await subscription?.unsubscribe()
}

/** The time zone this device's clock is in: `Europe/Kyiv`. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
