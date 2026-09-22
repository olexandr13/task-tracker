import type { Account } from '../../storage/authService'
import type { Theme } from '../../storage/themeRepository'
import type { BackupStatus } from '../useBackup'
import { AccountCard } from './AccountCard'
import { BackupCard } from './BackupCard'
import { ThemeCard } from './ThemeCard'

interface SettingsListProps {
  account: Account
  onSignOut: () => void
  backup: BackupStatus
  onExport: () => void
  onImport: (file: File) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/**
 * The settings page: who is signed in and the way out, then the account's data
 * as a file to keep and a file to bring back, then the theme, then which build
 * of the app this is. Anything else there is to set goes above the version.
 */
export function SettingsList({ account, onSignOut, backup, onExport, onImport, theme, onThemeChange }: SettingsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} onSignOut={onSignOut} />
      <BackupCard status={backup} onExport={onExport} onImport={onImport} />
      <ThemeCard theme={theme} onChange={onThemeChange} />
      <p className="px-1 text-xs text-neutral-500 dark:text-neutral-400">Version {__APP_VERSION__}</p>
    </div>
  )
}
