import type { CheckInDeviceRepository } from './checkInDeviceRepository'
import type { ChestDeviceRepository } from './chestDeviceRepository'
import type { HabitViewOptionsRepository } from './habitViewOptionsRepository'
import { localStorageCheckInDeviceRepository } from './localStorageCheckInDeviceRepository'
import { localStorageChestDeviceRepository } from './localStorageChestDeviceRepository'
import { localStorageHabitViewOptionsRepository } from './localStorageHabitViewOptionsRepository'
import { localStorageNudgeRepository } from './localStorageNudgeRepository'
import { localStorageQuoteRepository } from './localStorageQuoteRepository'
import { localStorageSideNavRepository } from './localStorageSideNavRepository'
import { localStorageTaskTimerRepository } from './localStorageTaskTimerRepository'
import { localStorageThemeRepository } from './localStorageThemeRepository'
import { localStorageViewOptionsRepository } from './localStorageViewOptionsRepository'
import type { NudgeDeviceRepository } from './nudgeDeviceRepository'
import type { QuoteRepository } from './quoteRepository'
import type { SideNavRepository } from './sideNavRepository'
import type { TaskTimerRepository } from './taskTimerRepository'
import type { ThemeRepository } from './themeRepository'
import type { ViewOptionsRepository } from './viewOptionsRepository'

/**
 * What is kept on this device rather than in the account: how things are shown
 * here, what is running here, what the nudge has already said here, what the
 * chest keeps here, what the check-in keeps here, and today's quote (STORE-30,
 * STORE-31, STORE-36, STORE-40, STORE-46, STORE-49, STORE-54).
 * The same whoever is signed in, and never synced.
 */
export interface DeviceStorage {
  readonly viewOptions: ViewOptionsRepository
  readonly habitViewOptions: HabitViewOptionsRepository
  readonly sideNav: SideNavRepository
  readonly taskTimer: TaskTimerRepository
  /** What the nudge keeps here: when it last spoke, and the notice it left standing (NUDGE-6). */
  readonly nudge: NudgeDeviceRepository
  /** What the chest keeps here: the noise, the last opening, the notice already given (CHST-24). */
  readonly chest: ChestDeviceRepository
  /** What the check-in keeps here: the notice dismissed, and this device's push registration (STORE-54). */
  readonly checkIn: CheckInDeviceRepository
  readonly quote: QuoteRepository
  readonly theme: ThemeRepository
}

export const deviceStorage: DeviceStorage = {
  viewOptions: localStorageViewOptionsRepository,
  habitViewOptions: localStorageHabitViewOptionsRepository,
  sideNav: localStorageSideNavRepository,
  taskTimer: localStorageTaskTimerRepository,
  nudge: localStorageNudgeRepository,
  chest: localStorageChestDeviceRepository,
  checkIn: localStorageCheckInDeviceRepository,
  quote: localStorageQuoteRepository,
  theme: localStorageThemeRepository,
}
