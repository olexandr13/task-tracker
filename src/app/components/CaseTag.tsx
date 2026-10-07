import type { ReactNode } from 'react'

interface CaseTagProps {
  /** The mark in front: a padlock on a case still on its way, a tick on one already opened. */
  readonly icon: ReactNode
  readonly children: ReactNode
  /** `timer` for a countdown, so it is announced as one, with its name. */
  readonly role?: 'timer'
  readonly label?: string
}

/**
 * The tag across a case's crate, over the dial, saying where the case
 * stands: the padlock on one still on its way (CHST-31), *Opened* on one the
 * day has had (CHST-28). It stays solid while the crate under it is faded, and
 * is drawn light on dark whatever the theme, as the plate it stands on is
 * (CHST-25).
 */
export function CaseTag({ icon, children, role, label }: CaseTagProps) {
  return (
    <div
      role={role}
      aria-label={label}
      className="flex max-w-full items-center gap-1.5 rounded-lg bg-neutral-950/90 px-2 py-1.5 leading-none whitespace-nowrap shadow-lg ring-1 shadow-black/60 ring-white/15"
    >
      {icon}
      <p className="flex items-baseline gap-1">{children}</p>
    </div>
  )
}
