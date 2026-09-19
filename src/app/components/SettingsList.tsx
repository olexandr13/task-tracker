import type { Account } from '../../storage/authService'
import type { BackupStatus } from '../useBackup'
import { AccountCard } from './AccountCard'
import { BackupCard } from './BackupCard'

interface SettingsListProps {
  account: Account
  onSignOut: () => void
  backup: BackupStatus
  onExport: () => void
  onImport: (file: File) => void
}

/**
 * The settings page: who is signed in and the way out, then the account's data
 * as a file to keep and a file to bring back. Anything else there is to set goes
 * under them.
 */
export function SettingsList({ account, onSignOut, backup, onExport, onImport }: SettingsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} onSignOut={onSignOut} />
      <BackupCard status={backup} onExport={onExport} onImport={onImport} />
    </div>
  )
}
