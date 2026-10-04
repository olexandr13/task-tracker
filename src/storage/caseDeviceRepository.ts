import type { CaseQuarter, LocalDay } from '../core'

/**
 * What Cases keeps on this device: whether it makes a noise here, which
 * opening it is still glowing from, whether it has already said here that a
 * key is waiting, and whether it has already said here that Monday's Weekly is
 * here.
 *
 * What it asks of a day is the account's (./rewardRepository, CHST-3) — how someone wants to be paid travels with
 * them. These are the half only the device can answer. Whether to make a
 * noise is the room you are in rather than the account you are in; a notice
 * already given on the laptop is no reason to withhold it on the phone, which
 * has its own (CHST-24); and the ledger says what today's case gave but not
 * which colour it gave it in, that being the show rather than the record
 * (CHST-14).
 */
export interface CaseDeviceState {
  readonly sound: boolean
  /**
   * Today's opening as this device saw it — which quarter of the jackpot it came
   * to, and so which colour it was — or null for none it saw.
   */
  readonly lastOpen: { readonly day: LocalDay; readonly quarter: CaseQuarter } | null
  /** The day this device said a key was waiting, or null for none. */
  readonly noticedDay: LocalDay | null
  /** The Monday this device said Weekly was here, or null for none (CHST-30). */
  readonly noticedWeek: LocalDay | null
}

/**
 * How a device arrives: with a noise. Pressing a case is as plain a yes as a
 * control gets, and a bandit in silence is half a bandit — so this is the one
 * setting in the app that starts at on and is turned off rather than on.
 */
export const CASES_AT_REST: CaseDeviceState = { sound: true, lastOpen: null, noticedDay: null, noticedWeek: null }

/** Where this device's half of Cases is kept between visits. */
export interface CaseDeviceRepository {
  load(): CaseDeviceState
  save(state: CaseDeviceState): void
}
