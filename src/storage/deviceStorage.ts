import type { CheckInDeviceRepository } from './checkInDeviceRepository'
import type { CaseDeviceRepository } from './caseDeviceRepository'
import type { HabitViewOptionsRepository } from './habitViewOptionsRepository'
import { localStorageCheckInDeviceRepository } from './localStorageCheckInDeviceRepository'
import { localStorageCaseDeviceRepository } from './localStorageCaseDeviceRepository'
import { localStorageHabitViewOptionsRepository } from './localStorageHabitViewOptionsRepository'
import { localStorageNudgeRepository } from './localStorageNudgeRepository'
import { localStorageQuoteRepository } from './localStorageQuoteRepository'
import { localStorageSettingsLayoutRepository } from './localStorageSettingsLayoutRepository'
import { localStorageSideNavRepository } from './localStorageSideNavRepository'
import { localStorageTaskTimerRepository } from './localStorageTaskTimerRepository'
import { localStorageThemeRepository } from './localStorageThemeRepository'
import { localStorageViewOptionsRepository } from './localStorageViewOptionsRepository'
import type { NudgeDeviceRepository } from './nudgeDeviceRepository'
import type { QuoteRepository } from './quoteRepository'
import type { SettingsLayoutRepository } from './settingsLayoutRepository'
import type { SideNavRepository } from './sideNavRepository'
import type { TaskTimerRepository } from './taskTimerRepository'
import type { ThemeRepository } from './themeRepository'
import type { ViewOptionsRepository } from './viewOptionsRepository'

/**
 * What is kept on this device rather than in the account: how things are shown
 * here — Settings' folds among them — what is running here, what the nudge has already said here, what the
 * cases keeps here, what the check-in keeps here, and today's quote (STORE-30,
 * STORE-31, STORE-36, STORE-40, STORE-46, STORE-49, STORE-54, STORE-57).
 * The same whoever is signed in, and never synced.
 */
export interface DeviceStorage {
  readonly viewOptions: ViewOptionsRepository
  readonly habitViewOptions: HabitViewOptionsRepository
  readonly sideNav: SideNavRepository
  /** Which parts of Settings are folded (STORE-57). */
  readonly settingsLayout: SettingsLayoutRepository
  readonly taskTimer: TaskTimerRepository
  /** What the nudge keeps here: when it last spoke, and the notice it left standing (NUDGE-6). */
  readonly nudge: NudgeDeviceRepository
  /** What Cases keeps here: the noise, the last opening, the notice already given (CHST-24). */
  readonly cases: CaseDeviceRepository
  /** What the check-in keeps here: the notice dismissed, and this device's push registration (STORE-54). */
  readonly checkIn: CheckInDeviceRepository
  readonly quote: QuoteRepository
  readonly theme: ThemeRepository
}

export const deviceStorage: DeviceStorage = {
  viewOptions: localStorageViewOptionsRepository,
  habitViewOptions: localStorageHabitViewOptionsRepository,
  sideNav: localStorageSideNavRepository,
  settingsLayout: localStorageSettingsLayoutRepository,
  taskTimer: localStorageTaskTimerRepository,
  nudge: localStorageNudgeRepository,
  cases: localStorageCaseDeviceRepository,
  checkIn: localStorageCheckInDeviceRepository,
  quote: localStorageQuoteRepository,
  theme: localStorageThemeRepository,
}
