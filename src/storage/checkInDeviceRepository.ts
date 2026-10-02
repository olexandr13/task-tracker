/**
 * What the check-in keeps on this device: the notice dismissed here, and whether
 * this device is to be reached when the app is closed (CHECKIN-11).
 *
 * The setting itself is the account's (./checkInRepository). This is the half
 * only the device can answer: a notice put away on the laptop is still worth
 * showing on the phone, and a push reaches a device rather than an account.
 */
export interface CheckInDeviceState {
  /** The hour whose notice was dismissed here (`slotKey`), or null. */
  readonly dismissedSlot: string | null
  /** The id this device's push registration is kept under, once it has one. */
  readonly pushDeviceId: string | null
  /** Whether this device is to be pushed check-ins when the app is closed. */
  readonly pushOn: boolean
}

/** Nothing dismissed, and no push — how a device arrives. */
export const CHECK_IN_DEVICE_NEW: CheckInDeviceState = { dismissedSlot: null, pushDeviceId: null, pushOn: false }

export interface CheckInDeviceRepository {
  load(): CheckInDeviceState
  save(state: CheckInDeviceState): void
}
