import type { ReactNode, Ref } from 'react'
import { panelClear, panelOptionOn, panelRow } from '../panelControls'
import { ChevronIcon } from './ChevronIcon'

interface PanelRowProps {
  /** The glyph the group is marked with wherever it appears. */
  icon: ReactNode
  /** What the row sets, in a word: it is the name of the view it opens. */
  name: string
  /** What the row holds now, or null for nothing set. */
  value: string | null
  /** Read in the value's place when nothing is set: what there would be, or why there is nothing. */
  empty: string
  /** Said in full where the name and the value do not say it, such as why the row will not open. */
  hint?: string
  /** Opening the row's own choices. Left out where there is nothing yet to choose against. */
  onOpen?: () => void
  /** Taking what the row holds away, in a tap. Left out where there is nothing to take away. */
  onClear?: () => void
  /** The row's own button, so the focus can come back to it from the view it opened. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * A line of a panel standing in for a group of choices of its own: its icon,
 * its name, what it is set to now, and the chevron that says the choices are a
 * tap away. Beside it, where there is something set, a × takes it back off
 * without opening anything.
 *
 * It is what keeps a panel to one screenful: a group that would have run past
 * the foot of the panel is one line until it is asked for.
 */
export function PanelRow({ icon, name, value, empty, hint, onOpen, onClear, ref }: PanelRowProps) {
  const set = value !== null

  return (
    <div className="flex items-center gap-0.5">
      <button
        ref={ref}
        type="button"
        disabled={onOpen === undefined}
        onClick={onOpen}
        aria-haspopup={onOpen === undefined ? undefined : 'true'}
        aria-label={`${name}: ${value ?? empty}`}
        title={hint ?? `${name}: ${value ?? empty}`}
        className={`${panelRow} flex-1 ${set ? panelOptionOn : 'text-neutral-700 dark:text-neutral-200'}`}
      >
        <span aria-hidden="true" className="shrink-0 [&>svg]:size-5 md:[&>svg]:size-4">
          {icon}
        </span>
        {name}
        <span
          aria-hidden="true"
          className={
            set
              ? 'ml-auto min-w-0 truncate text-sm md:text-xs'
              : 'ml-auto min-w-0 truncate text-sm text-neutral-400 md:text-xs dark:text-neutral-500'
          }
        >
          {value ?? empty}
        </span>
        {onOpen !== undefined && (
          <ChevronIcon className="size-4 shrink-0 -rotate-90 text-neutral-300 dark:text-neutral-600" />
        )}
      </button>

      {onClear !== undefined && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove ${name.toLowerCase()}`}
          title={`Remove ${name.toLowerCase()}`}
          className={panelClear}
        >
          ×
        </button>
      )}
    </div>
  )
}
