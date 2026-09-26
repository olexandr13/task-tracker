import type { Ref } from 'react'
import { panelBack } from '../panelControls'
import { ChevronIcon } from './ChevronIcon'

interface PanelBackProps {
  /** The group being looked at, which is the name the row that opened it carries. */
  name: string
  onBack: () => void
  /** The link itself, so the focus can be put on it as the view opens. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * The head of a group's own view inside a panel: what is being looked at, and
 * the way back to the rows it was opened from. The whole line is the way back,
 * so it takes no aim to leave a view that was entered with one tap.
 */
export function PanelBack({ name, onBack, ref }: PanelBackProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onBack}
      aria-label={`Back from ${name.toLowerCase()}`}
      className={`${panelBack} text-neutral-900 dark:text-neutral-100`}
    >
      <ChevronIcon className="size-4 shrink-0 rotate-90 text-neutral-400 dark:text-neutral-500" />
      {name}
    </button>
  )
}
