import type { Weekday } from '../../core'
import {
  panelHeading,
  panelOption as option,
  panelOptionOff as optionOff,
  panelOptionOn as optionOn,
} from '../panelControls'
import type { RepeatDraft, RepeatKind } from '../repeatDraft'
import { WEEKDAYS } from '../repeatLabels'

const KINDS: readonly { readonly value: Exclude<RepeatKind, 'once'>; readonly label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const dayChip = 'size-6 rounded-full text-xs transition-colors'
const dayChipOn = 'bg-blue-600 text-white hover:bg-blue-700'
const dayChipOff =
  'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

interface RepeatChoicesProps {
  draft: RepeatDraft
  onChange: (draft: RepeatDraft) => void
  /**
   * Whether the group names itself above its kinds. Off where what opened it
   * already carries the name, as the schedule panel's Repeat row does.
   */
  named?: boolean
  /** Called once a choice leaves nothing further to choose here, so the panel can move on. */
  onDone: () => void
}

/**
 * How often a task comes round, and on which days. There is no confirm step.
 * Every choice is saved as it is made, and choosing the kind already chosen
 * clears it, so a footer would only have offered a second way to do that.
 */
export function RepeatChoices({ draft, onChange, named = true, onDone }: RepeatChoicesProps) {
  function toggleWeekday(weekday: Weekday) {
    const selected = draft.weekdays.includes(weekday)
    // A weekly repeat with no day would have no occurrences, so taking away the
    // last one clears the rule instead. The day stays in the draft, ready for
    // Weekly to be chosen again, and clearing leaves nothing further to choose.
    if (selected && draft.weekdays.length === 1) {
      onChange({ ...draft, kind: 'once' })
      onDone()
      return
    }

    onChange({
      ...draft,
      weekdays: selected ? draft.weekdays.filter((day) => day !== weekday) : [...draft.weekdays, weekday],
    })
  }

  return (
    <>
      <div role="group" aria-label="Repeat" className="flex flex-col">
        {/* The group's name is its label already; this is the same word for the eye. Hidden
            where the row or the link that opened the group is already showing it. */}
        {named && (
          <p aria-hidden="true" className={`${panelHeading} pb-0.5`}>
            Repeat
          </p>
        )}
        {KINDS.map(({ value, label }) => {
          const chosen = draft.kind === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={chosen}
              onClick={() => {
                const kind = chosen ? 'once' : value
                onChange({ ...draft, kind })
                // Daily, and clearing, leave nothing further to choose. Weekly and
                // monthly open their own choices below and stay for them.
                if (kind !== 'weekly' && kind !== 'monthly') onDone()
              }}
              className={chosen ? `${option} ${optionOn}` : `${option} ${optionOff}`}
            >
              <span aria-hidden="true" className="w-3 shrink-0">
                {chosen ? '✓' : ''}
              </span>
              {label}
            </button>
          )
        })}
      </div>

      {draft.kind === 'weekly' && (
        <div
          role="group"
          aria-label="Repeat on"
          className="flex items-center justify-between border-t border-neutral-200 px-0.5 pt-1.5 dark:border-neutral-800"
        >
          {WEEKDAYS.map(({ value, initial, name }) => {
            const selected = draft.weekdays.includes(value)
            return (
              <button
                key={name}
                type="button"
                onClick={() => { toggleWeekday(value) }}
                aria-pressed={selected}
                aria-label={name}
                className={selected ? `${dayChip} ${dayChipOn}` : `${dayChip} ${dayChipOff}`}
              >
                {initial}
              </button>
            )
          })}
        </div>
      )}

      {draft.kind === 'monthly' && (
        <div className="border-t border-neutral-200 px-1.5 pt-1.5 pb-0.5 dark:border-neutral-800">
          <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            On day
            <select
              value={draft.monthDay}
              onChange={(event) => { onChange({ ...draft, monthDay: Number(event.target.value) }) }}
              className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100"
            >
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day} className="dark:bg-neutral-900">
                  {/* The 31st is the last day of every month it cannot land on (RPT-20). */}
                  {day === 31 ? '31/last' : day}
                </option>
              ))}
            </select>
          </label>
          {draft.monthDay > 28 && (
            <p className="pt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              Shorter months fall back to their last day.
            </p>
          )}
        </div>
      )}
    </>
  )
}
