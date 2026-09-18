import type { Account } from '../../storage/authService'
import { AccountCard } from './AccountCard'

interface SettingsListProps {
  account: Account
  onSignOut: () => void
}

/**
 * The settings page. The account is the whole of it for now: who is signed in and
 * the way out. Anything else there is to set goes under it.
 */
export function SettingsList({ account, onSignOut }: SettingsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} onSignOut={onSignOut} />

      <p className="text-center text-sm text-neutral-400 dark:text-neutral-600">
        Nothing else to set yet. Settings will appear here.
      </p>
    </div>
  )
}
