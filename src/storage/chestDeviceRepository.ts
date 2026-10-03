import type { ChestQuarter, LocalDay } from '../core'

/**
 * What the chest keeps on this device: whether it makes a noise here, which
 * opening it is still glowing from, and whether it has already said here that a
 * key is waiting.
 *
 * What it asks of a day is the account's (./rewardRepository, CHST-3) — how someone wants to be paid travels with
 * them. These three are the half only the device can answer. Whether to make a
 * noise is the room you are in rather than the account you are in; a notice
 * already given on the laptop is no reason to withhold it on the phone, which
 * has its own (CHST-24); and the ledger says what today's chest gave but not
 * which colour it gave it in, that being the show rather than the record
 * (CHST-14).
 */
export interface ChestDeviceState {
  readonly sound: boolean
  /**
   * Today's opening as this device saw it — which quarter of the jackpot it came
   * to, and so which colour it was — or null for none it saw.
   */
  readonly lastOpen: { readonly day: LocalDay; readonly quarter: ChestQuarter } | null
  /** The day this device said a key was waiting, or null for none. */
  readonly noticedDay: LocalDay | null
}

/**
 * How a device arrives: with a noise. Pressing a chest is as plain a yes as a
 * control gets, and a bandit in silence is half a bandit — so this is the one
 * setting in the app that starts at on and is turned off rather than on.
 */
export const CHEST_AT_REST: ChestDeviceState = { sound: true, lastOpen: null, noticedDay: null }

/** Where this device's half of the chest is kept between visits. */
export interface ChestDeviceRepository {
  load(): ChestDeviceState
  save(state: ChestDeviceState): void
}
