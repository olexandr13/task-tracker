import { useEffect, useRef, useState } from 'react'
import type { Weekday } from '../../core'
import type { RepeatDraft, RepeatKind } from '../repeatDraft'
import { toRepeat } from '../repeatDraft'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'
import { WEEKDAYS, describeRepeat } from '../repeatLabels'
import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { RepeatIcon } from './RepeatIcon'

const KINDS: readonly { readonly value: Exclude<RepeatKind, 'once'>; readonly label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const dayChip = 'size-6 rounded-full text-xs transition-colors'
const dayChipOn = 'bg-blue-600 text-white hover:bg-blue-700'
const dayChipOff =
  'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

interface RepeatPickerProps {
  draft: RepeatDraft
  onChange: (draft: RepeatDraft) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /**
   * Whether the button spells the rule out beside its icon. Off, the icon alone
   * says there is one; the rule is still its name and its tooltip.
   */
  showRule?: boolean
}

/**
 * One control, not a row of them: a button in the add row that opens a panel
 * holding every repeat choice, so the form itself stays a single line.
 *
 * The panel has no confirm step. Every choice is saved as it is made, so a
 * footer would only have offered a second way to do what clicking the chosen
 * kind again already does — clear it.
 */
export function RepeatPicker({ draft, onChange, label = 'Repeat', showRule = true }: RepeatPickerProps) {
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

  function toggleWeekday(weekday: Weekday) {
    const selected = draft.weekdays.includes(weekday)
    // Never leave a weekly repeat with no day: it would have no occurrences.
    if (selected && draft.weekdays.length === 1) return

    onChange({
      ...draft,
      weekdays: selected ? draft.weekdays.filter((day) => day !== weekday) : [...draft.weekdays, weekday],
    })
  }

  const rule = toRepeat(draft)
  const summary = rule === null ? 'Repeat' : describeRepeat(rule)

  // Only as wide as it needs to be: a square around the icon when the value is
  // not spelled out beside it.
  const named = rule !== null && showRule
  const button = `${named ? rowControlLabel : rowControlIcon} w-full`

  return (
    <div
      ref={root}
      className="relative min-w-0 shrink"
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
        aria-label={`${label}: ${summary}`}
        title={summary}
        className={rule === null ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <RepeatIcon />
        {named && <span className="max-w-28 truncate sm:max-w-48">{summary}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 z-10 mt-1.5 flex w-52 flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div role="group" aria-label="How often" className="flex flex-col">
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
                    // Daily, and clearing, leave nothing further to choose, so the
                    // panel has said all it has to say. Weekly and monthly open
                    // their own choices below and stay for them.
                    if (kind !== 'weekly' && kind !== 'monthly') setIsOpen(false)
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
                      {day}
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
        </div>
      )}
    </div>
  )
}
