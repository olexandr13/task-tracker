import type { HabitViewOptionsRepository } from './habitViewOptionsRepository'
import { localStorageHabitViewOptionsRepository } from './localStorageHabitViewOptionsRepository'
import { localStorageNudgeRepository } from './localStorageNudgeRepository'
import { localStorageQuoteRepository } from './localStorageQuoteRepository'
import { localStorageSideNavRepository } from './localStorageSideNavRepository'
import { localStorageTaskTimerRepository } from './localStorageTaskTimerRepository'
import { localStorageThemeRepository } from './localStorageThemeRepository'
import { localStorageViewOptionsRepository } from './localStorageViewOptionsRepository'
import type { NudgeRepository } from './nudgeRepository'
import type { QuoteRepository } from './quoteRepository'
import type { SideNavRepository } from './sideNavRepository'
import type { TaskTimerRepository } from './taskTimerRepository'
import type { ThemeRepository } from './themeRepository'
import type { ViewOptionsRepository } from './viewOptionsRepository'

/**
 * What is kept on this device rather than in the account: how things are shown
 * here, what is running here, and today's quote (STORE-30, STORE-31, STORE-36,
 * STORE-40).
 * The same whoever is signed in, and never synced.
 */
export interface DeviceStorage {
  readonly viewOptions: ViewOptionsRepository
  readonly habitViewOptions: HabitViewOptionsRepository
  readonly sideNav: SideNavRepository
  readonly taskTimer: TaskTimerRepository
  readonly nudge: NudgeRepository
  readonly quote: QuoteRepository
  readonly theme: ThemeRepository
}

export const deviceStorage: DeviceStorage = {
  viewOptions: localStorageViewOptionsRepository,
  habitViewOptions: localStorageHabitViewOptionsRepository,
  sideNav: localStorageSideNavRepository,
  taskTimer: localStorageTaskTimerRepository,
  nudge: localStorageNudgeRepository,
  quote: localStorageQuoteRepository,
  theme: localStorageThemeRepository,
}
