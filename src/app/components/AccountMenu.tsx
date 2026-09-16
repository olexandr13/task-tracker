import { useEffect, useRef, useState } from 'react'
import type { Account } from '../../storage/authService'

interface AccountMenuProps {
  account: Account
  onSignOut: () => void
}

/**
 * Who is signed in, as their picture, opening onto their name, their address
 * and the way out.
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
        aria-label={`Account: ${who}`}
        title={who}
        className="flex rounded-full transition-shadow hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-700"
      >
        <Avatar account={account} className="size-8 text-sm" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute right-0 z-20 mt-2 flex w-64 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar account={account} className="size-10 text-base" />
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
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
 * The account's picture, or the first letter of its name where there is no
 * picture or it will not load. Purely decorative: whatever holds it says who it is.
 */
function Avatar({ account, className }: { account: Account; className: string }) {
  const [isBroken, setIsBroken] = useState(false)
  const shape = `${className} shrink-0 rounded-full`

  if (account.photoUrl !== null && !isBroken) {
    return (
      <img
        src={account.photoUrl}
        alt=""
        // Google's picture host refuses requests that name another site as the referrer.
        referrerPolicy="no-referrer"
        onError={() => { setIsBroken(true) }}
        className={`${shape} object-cover`}
      />
    )
  }

  const initial = Array.from(account.name || account.email || '?')[0].toUpperCase()

  return (
    <span
      aria-hidden="true"
      className={`${shape} flex items-center justify-center bg-blue-600 font-medium text-white dark:bg-blue-500`}
    >
      {initial}
    </span>
  )
}
