import type { Account } from '../../storage/authService'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import type { Theme } from '../../storage/themeRepository'
import type { BackupStatus } from '../useBackup'
import { AccountCard } from './AccountCard'
import { BackupCard } from './BackupCard'
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
}

/**
 * The settings page: who is signed in and the way out, then the account's data
 * as a file to keep and a file to bring back, then the theme and the view
 * settings — how the pages start out — then which build of the app this is.
 * Anything else there is to set goes above the version.
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
}: SettingsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} onSignOut={onSignOut} />
      <BackupCard status={backup} onExport={onExport} onImport={onImport} />
      <ThemeCard theme={theme} onChange={onThemeChange} />
      <ViewSettingsCard habitView={habitView} onHabitViewChange={onHabitViewChange} />
      <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">Version {__APP_VERSION__}</p>
    </div>
  )
}
