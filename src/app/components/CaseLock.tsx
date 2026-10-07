import type { ReactNode } from 'react'
import { CaseTag } from './CaseTag'
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
 * beside it, on the crate's tag.
 */
export function CaseLock({ children, role, label }: CaseLockProps) {
  return (
    <CaseTag icon={<LockIcon className="size-3.5 shrink-0 text-neutral-300" />} role={role} label={label}>
      {children}
    </CaseTag>
  )
}
