import type { QuietHours } from '../../core'
import type { Account } from '../../storage/authService'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import type { Theme } from '../../storage/themeRepository'
import type { NudgeControl } from '../useNudge'
import type { BackupStatus } from '../useBackup'
import { AccountCard } from './AccountCard'
import { BackupCard } from './BackupCard'
import { HabitsCard } from './HabitsCard'
import { NudgeCard } from './NudgeCard'
import { ThemeCard } from './ThemeCard'

interface SettingsListProps {
  account: Account
  onSignOut: () => void
  backup: BackupStatus
  onExport: () => void
  onImport: (file: File) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  nudge: NudgeControl
  habitView: HabitViewOptions
  onHabitViewChange: (options: HabitViewOptions) => void
}

/**
 * The settings page: who is signed in and the way out, then the account's data
 * as a file to keep and a file to bring back, then the nudge, the theme and how
 * the habit cards start, then which build of the app this is. Anything else
 * there is to set goes above the version.
 */
export function SettingsList({
  account,
  onSignOut,
  backup,
  onExport,
  onImport,
  theme,
  onThemeChange,
  nudge,
  habitView,
  onHabitViewChange,
}: SettingsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} onSignOut={onSignOut} />
      <BackupCard status={backup} onExport={onExport} onImport={onImport} />
      <NudgeCard
        on={nudge.setting.on}
        quietHours={nudge.setting.quietHours}
        permission={nudge.permission}
        onTurnOn={nudge.turnOn}
        onQuietHoursChange={(hours: QuietHours) => { nudge.changeQuietHours(hours) }}
      />
      <ThemeCard theme={theme} onChange={onThemeChange} />
      <HabitsCard options={habitView} onChange={onHabitViewChange} />
      <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">Version {__APP_VERSION__}</p>
    </div>
  )
}
