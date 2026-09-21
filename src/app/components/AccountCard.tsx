import type { ReactElement } from 'react'
import type { Account, AccountProvider } from '../../storage/authService'
import { GoogleLogo } from './GoogleLogo'
import { GuestMark } from './GuestMark'

/** What each way in is called and what it looks like. A new provider is a line here. */
const PROVIDERS: Record<
  AccountProvider,
  { name: string; Mark: (props: { className?: string }) => ReactElement; caption: (account: Account) => string }
> = {
  google: {
    name: 'Google',
    Mark: GoogleLogo,
    caption: () => 'Signed in with Google',
  },
  guest: {
    name: 'Guest',
    Mark: GuestMark,
    caption: () => 'Saved on this device only',
  },
}

interface AccountCardProps {
  account: Account
  onSignOut: () => void
}

/**
 * Who is signed in, on Settings: the mark of the service they signed in through,
 * their name, their address and the way out. All on the page rather than behind a
 * button — a page of settings has the room to say it outright, and where the
 * account lives is the one place nothing else is competing for the space.
 */
export function AccountCard({ account, onSignOut }: AccountCardProps) {
  const provider = PROVIDERS[account.provider]

  return (
    <section
      aria-label="Account"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <ProviderMark provider={account.provider} />

      <div className="min-w-0 flex-1">
        {account.name !== null && <p className="truncate text-sm font-medium">{account.name}</p>}
        {account.email !== null && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{account.email}</p>
        )}
        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{provider.caption(account)}</p>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        {account.provider === 'guest' ? 'Leave' : 'Sign out'}
      </button>
    </section>
  )
}

/**
 * The mark of the service the account signed in through, on a white disc so the
 * mark keeps its own colours in either theme. Neither the Google picture nor the
 * name is shown here. Purely decorative: the lines beside it say who it is and
 * which service, so a screen reader hears it there rather than twice.
 */
function ProviderMark({ provider }: { provider: AccountProvider }) {
  const { Mark } = PROVIDERS[provider]

  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
    >
      <Mark className="size-6 shrink-0" />
    </span>
  )
}
