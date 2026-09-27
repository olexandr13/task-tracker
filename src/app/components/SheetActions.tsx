import { useState, type ReactNode } from 'react'
import { controlOff, controlOn, rowControlIcon, sheetIconAction } from '../rowControls'
import { InfoIcon } from './InfoIcon'

export interface SheetAction {
  /** What the control sets, in a word: the name its icon is given when asked for. */
  name: string
  /**
   * What it holds now, spelled out under its icon; nothing where there is nothing
   * set, and nothing where the value is as long as something the user names — a
   * list, a row of tags — which no column of this row has the width for.
   */
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
 * so the names go and what is set is spelled out **under the icon it belongs to**
 * — everything readable at a glance, in a fraction of the height, with nothing to
 * trace back along a line to the icon it came from.
 *
 * A column is a seventh of a phone wide, which is enough for a day, an hour, a
 * reward, and not for what a person names themselves. A list and a row of tags
 * are therefore **not spelled out at all**: the tinted icon says the task has one,
 * and the panel a tap opens says which — worth more than a line of text wrapped
 * three deep under a row of icons.
 *
 * An icon says nothing by itself the first time it is met, and a tooltip never
 * reaches a thumb, so the **i** at the end of the row names every icon under it
 * for as long as it is left on.
 */
export function SheetActions({ actions, label }: SheetActionsProps) {
  const [named, setNamed] = useState(false)

  return (
    <div role="group" aria-label={label} className="flex items-start px-2 py-2">
      {actions.map((action) => (
        <div key={action.name} className={sheetIconAction}>
          {action.control}
          {named && (
            <span aria-hidden="true" className="max-w-full truncate text-[10px] leading-3 text-neutral-400 dark:text-neutral-500">
              {action.name}
            </span>
          )}
          {action.detail !== null && action.detail !== undefined && (
            <span className="max-w-full text-center text-[11px] leading-tight break-words text-neutral-500 dark:text-neutral-400">
              {action.detail}
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
  )
}
