/**
 * What the check-in keeps on this device: the notice dismissed here.
 *
 * The setting itself is the account's (./checkInRepository). This is the half
 * only the device can answer: a notice put away on the laptop is still worth
 * showing on the phone.
 */
export interface CheckInDeviceState {
  /** The hour whose notice was dismissed here (`slotKey`), or null. */
  readonly dismissedSlot: string | null
}

/** Nothing dismissed — how a device arrives. */
export const CHECK_IN_DEVICE_NEW: CheckInDeviceState = { dismissedSlot: null }

export interface CheckInDeviceRepository {
  load(): CheckInDeviceState
  save(state: CheckInDeviceState): void
}
