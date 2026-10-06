import type { ReactNode } from 'react'
import { LockIcon } from './LockIcon'

interface CaseLockProps {
  /** What still stands between the case and being ready: tasks left, or the time until it arrives. */
  readonly children: ReactNode
  /** `timer` for a countdown, so it is announced as one, with its name. */
  readonly role?: 'timer'
  readonly label?: string
}

/**
 * The padlock on a case still on its way (CHST-31), with what will open it
 * under it. It sits on the crate itself, over the dial, solid while the crate
 * under it is grey and faded, and is drawn light on dark whatever the theme,
 * as the plate it stands on is (CHST-25).
 */
export function CaseLock({ children, role, label }: CaseLockProps) {
  return (
    <div
      role={role}
      aria-label={label}
      className="flex max-w-full items-center gap-1.5 rounded-lg bg-neutral-950/90 px-2 py-1.5 leading-none whitespace-nowrap shadow-lg ring-1 shadow-black/60 ring-white/15"
    >
      <LockIcon className="size-3.5 shrink-0 text-neutral-300" />
      <p className="flex items-baseline gap-1">{children}</p>
    </div>
  )
}
