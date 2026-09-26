import { useState, type ReactNode } from 'react'
import { controlOff, controlOn, rowControlIcon, sheetIconAction } from '../rowControls'
import { InfoIcon } from './InfoIcon'

export interface SheetAction {
  /** What the control sets, in a word: the name its icon is given when asked for. */
  name: string
  /** What it holds now, spelled out under the row; null for nothing set. */
  detail?: string | null
  /** The control itself, drawn as its icon alone. */
  control: ReactNode
}

interface SheetActionsProps {
  actions: readonly SheetAction[]
  /** What the row is for, when there is more than one sheet's worth on screen. */
  label: string
}

/**
 * What a task carries, as **one row of icons** rather than a line each: the
 * schedule, the list, the time, the tags, urgent and the reward. Six lines of
 * names and values is most of a phone's screen before the checklist is reached,
 * so the names go and what is set is spelled out in a line under them instead —
 * everything still readable at a glance, in a sixth of the height.
 *
 * An icon says nothing by itself the first time it is met, and a tooltip never
 * reaches a thumb, so the **i** at the end of the row names every icon under it
 * for as long as it is left on.
 */
export function SheetActions({ actions, label }: SheetActionsProps) {
  const [named, setNamed] = useState(false)
  const details = actions.map((action) => action.detail).filter((detail) => detail !== null && detail !== undefined)

  return (
    <div className="flex flex-col gap-1 px-2 py-2 md:gap-0.5">
      <div role="group" aria-label={label} className="flex items-start">
        {actions.map((action) => (
          <div key={action.name} className={sheetIconAction}>
            {action.control}
            {named && (
              <span aria-hidden="true" className="max-w-full truncate text-[10px] leading-3 text-neutral-400 dark:text-neutral-500">
                {action.name}
              </span>
            )}
          </div>
        ))}

        {/* Last, past the controls, since it changes nothing about the task. */}
        <div className={sheetIconAction}>
          <button
            type="button"
            onClick={() => { setNamed(!named) }}
            aria-pressed={named}
            aria-label="What each button does"
            title="What each button does"
            className={named ? `${rowControlIcon} ${controlOn}` : `${rowControlIcon} ${controlOff}`}
          >
            <InfoIcon />
          </button>
        </div>
      </div>

      {details.length > 0 && (
        <p className="px-1 text-xs text-neutral-500 md:text-[11px] dark:text-neutral-400">
          {details.join(' · ')}
        </p>
      )}
    </div>
  )
}
