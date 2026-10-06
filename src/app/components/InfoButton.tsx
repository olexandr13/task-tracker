import { useState, type ReactNode } from 'react'
import { BottomSheet } from './BottomSheet'
import { InfoIcon } from './InfoIcon'

/** A finger's size on a phone without making the heading beside it any taller. */
const button =
  'flex size-8 -my-1 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:my-0 md:size-6 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

interface InfoButtonProps {
  /** What this explains: the button's name, and the sheet's heading unless `heading` says otherwise. */
  label: string
  /** The sheet's heading, where it says more than the name of what is explained. */
  heading?: string
  children: ReactNode
}

/**
 * The **i** beside a heading that says what the page or card is for, in a sheet
 * rather than on the page itself — so the explanation is a tap away instead of
 * sitting there unread every time (UI-73).
 */
export function InfoButton({ label, heading = label, children }: InfoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true) }}
        aria-label={`About ${label}`}
        title={`About ${label}`}
        className={button}
      >
        <InfoIcon />
      </button>

      {open && (
        <BottomSheet label={heading} onClose={() => { setOpen(false) }}>
          <div className="overflow-y-auto px-4 pt-1 pb-3 md:px-5 md:pt-2">
            <h2 className="text-center text-lg leading-6 text-neutral-900 dark:text-neutral-100">{heading}</h2>
            <div className="mt-2 flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-400">{children}</div>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
