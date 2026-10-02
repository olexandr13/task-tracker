/**
 * What a device is pushed check-ins through when the app is closed (CHECKIN-10):
 * the browser's push subscription — where to send, and the keys to send with —
 * and the time zone its clock is in, so the sender asks about the device's own
 * hours.
 */
export interface PushSubscriptionData {
  readonly endpoint: string
  readonly keys: { readonly p256dh: string; readonly auth: string }
}

export interface PushRegistration {
  /** The id this device keeps its registration under (STORE-53, STORE-54). */
  readonly deviceId: string
  readonly subscription: PushSubscriptionData
  /** An IANA time zone: `Europe/Kyiv`. */
  readonly timeZone: string
}

/**
 * Where the account's push registrations are kept, one per device (STORE-53),
 * and the way to have the sender push a test to one. Every call site talks to
 * this interface rather than to the service behind it (./taskRepository).
 */
export interface PushRepository {
  /** Whether the account can be pushed to at all: signed in with Google, not as guest. */
  readonly available: boolean
  /** Keeps this device's registration, as it stands now. */
  register(registration: PushRegistration): Promise<void>
  /** Lets this device's registration go, so nothing is pushed to it any more. */
  forget(deviceId: string): Promise<void>
  /** Has the sender push a test to this device, now (CHECKIN-12). */
  sendTest(deviceId: string): Promise<void>
}

/** A guest has no account for a sender to read, so nothing can be pushed (CHECKIN-11). */
export const NO_PUSH: PushRepository = {
  available: false,
  register: () => Promise.reject(new Error('A guest cannot be pushed check-ins.')),
  forget: () => Promise.resolve(),
  sendTest: () => Promise.reject(new Error('A guest cannot be pushed check-ins.')),
}
