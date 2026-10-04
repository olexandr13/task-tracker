import { isFeatureOn, type Feature, type FeaturesOff } from '../../core'
import type { Account } from '../../storage/authService'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import type { Theme } from '../../storage/themeRepository'
import type { BackupStatus } from '../useBackup'
import { AccountCard } from './AccountCard'
import { BackupCard } from './BackupCard'
import { CasesPracticeCard } from './CasesPracticeCard'
import { FeaturesCard } from './FeaturesCard'
import { ThemeCard } from './ThemeCard'
import { ViewSettingsCard } from './ViewSettingsCard'

interface SettingsListProps {
  account: Account
  onSignOut: () => void
  backup: BackupStatus
  onExport: () => void
  onImport: (file: File) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  habitView: HabitViewOptions
  onHabitViewChange: (options: HabitViewOptions) => void
  casesPractice: boolean
  onCasesPracticeChange: (practising: boolean) => void
  /** The features switched off (FEAT-1), and whether the account has said yet (FEAT-8). */
  features: { readonly off: FeaturesOff; readonly loading: boolean }
  onFeatureChange: (feature: Feature, on: boolean) => void
}

/**
 * The settings page: who is signed in and the way out, then the account's data
 * as a file to keep and a file to bring back, then which parts of the app are
 * in use (FEAT-1), then the theme and the view settings — how the pages start
 * out — then Cases' practice switch (CHST-21), then which build of the app
 * this is. Anything else there is to set goes above the version.
 *
 * A card belonging to a part switched off goes with it (FEAT-3): how the habits
 * start out says nothing while there are none to see, nor the practice cases
 * while there is no cases.
 *
 * What belongs to one mode is set on that mode's own page rather than here
 * (MODE-12): the nudge's span and hours are read beside what the nudge does.
 */
export function SettingsList({
  account,
  onSignOut,
  backup,
  onExport,
  onImport,
  theme,
  onThemeChange,
  habitView,
  onHabitViewChange,
  casesPractice,
  onCasesPracticeChange,
  features,
  onFeatureChange,
}: SettingsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} onSignOut={onSignOut} />
      <BackupCard status={backup} onExport={onExport} onImport={onImport} />
      <FeaturesCard off={features.off} loading={features.loading} onChange={onFeatureChange} />
      <ThemeCard theme={theme} onChange={onThemeChange} />
      {isFeatureOn(features.off, 'habits') && (
        <ViewSettingsCard habitView={habitView} onHabitViewChange={onHabitViewChange} />
      )}
      {isFeatureOn(features.off, 'cases') && (
        <CasesPracticeCard practising={casesPractice} onChange={onCasesPracticeChange} />
      )}
      <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">Version {__APP_VERSION__}</p>
    </div>
  )
}
