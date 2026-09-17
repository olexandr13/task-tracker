import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { Account, AccountProvider } from '../../storage/authService'
import { panelOption } from '../panelControls'
import { GoogleLogo } from './GoogleLogo'

/** What each way in is called and what it looks like. A new provider is a line here. */
const PROVIDERS: Record<AccountProvider, { name: string; Mark: (props: { className?: string }) => ReactElement }> = {
  google: { name: 'Google', Mark: GoogleLogo },
}

interface AccountMenuProps {
  account: Account
  onSignOut: () => void
}

/**
 * Who is signed in, as the mark of the service they signed in through, opening
 * onto their name, their address and the way out.
 */
export function AccountMenu({ account, onSignOut }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  const who = account.name || account.email || 'Signed in'
  const provider = PROVIDERS[account.provider]

  return (
    <div
      ref={root}
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen) }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Account: ${who}, signed in with ${provider.name}`}
        title={`${who} · ${provider.name}`}
        className="flex rounded-full transition-shadow hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-700"
      >
        <ProviderMark provider={account.provider} className="size-8" markClassName="size-5" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute right-0 z-20 mt-2 flex w-64 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <ProviderMark provider={account.provider} className="size-10" markClassName="size-6" />
            <div className="min-w-0 flex-1">
              {account.name !== null && <p className="truncate text-sm font-medium">{account.name}</p>}
              {account.email !== null && (
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{account.email}</p>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-1 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onSignOut()
              }}
              className={`${panelOption} text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100`}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The mark of the service the account signed in through, on a white disc so the
 * mark keeps its own colours in either theme. Neither the Google picture nor the
 * name is shown here. Purely decorative: whatever holds it says who it is.
 */
function ProviderMark({
  provider,
  className,
  markClassName,
}: {
  provider: AccountProvider
  className: string
  markClassName: string
}) {
  const { Mark } = PROVIDERS[provider]

  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700`}
    >
      <Mark className={`${markClassName} shrink-0`} />
    </span>
  )
}
