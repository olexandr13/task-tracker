import { useEffect, useRef, useState } from 'react'
import { isLocalDay, nextWeekDueDay, offsetDay, toLocalDay, type LocalDay } from '../../core'
import { describeDueDate, describeWeekday } from '../dueLabels'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'
import { controlOff, controlOn } from '../rowControls'
import { CalendarIcon } from './CalendarIcon'

const button = 'flex h-6 w-full items-center gap-1.5 rounded-lg px-2 text-sm leading-none transition-colors'
/** A day gone by with the task still open reads as a warning, not as information. */
const buttonOverdue = 'bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:text-red-400'

interface DuePickerProps {
  dueDate: LocalDay | null
  now: Date
  onChange: (dueDate: LocalDay | null) => void
  /** Due on a day already gone and still to do. */
  overdue?: boolean
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /**
   * Whether the button spells the date out beside its icon. Off, it is the icon
   * alone, still tinted, with the date as its name and tooltip.
   */
  showDate?: boolean
}

/**
 * When a task is due: a small button that opens a panel of quick choices and a
 * date field for any other day, the same shape as the repeat picker beside it.
 *
 * Like that picker there is nothing to confirm — each choice is saved as it is
 * made. A quick choice closes the panel, having said everything; the date field
 * leaves it open, since a date is typed a part at a time and closing on the
 * first part would take the rest away.
 */
export function DuePicker({
  dueDate,
  now,
  onChange,
  overdue = false,
  label = 'Due date',
  showDate = true,
}: DuePickerProps) {
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

  const today = toLocalDay(now)
  const choices: readonly { readonly label: string; readonly day: LocalDay }[] = [
    { label: 'Today', day: today },
    { label: 'Tomorrow', day: offsetDay(today, 1) },
    { label: 'Next week', day: nextWeekDueDay(now) },
  ]
  const summary = dueDate === null ? 'No date' : describeDueDate(dueDate, now)

  function choose(day: LocalDay | null) {
    onChange(day)
    setIsOpen(false)
  }

  return (
    <div
      ref={root}
      className="relative shrink-0"
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
        aria-label={`${label}: ${summary}${overdue ? ', overdue' : ''}`}
        title={overdue ? `${summary} — overdue` : summary}
        className={
          dueDate === null ? `${button} ${controlOff}` : overdue ? `${button} ${buttonOverdue}` : `${button} ${controlOn}`
        }
      >
        <CalendarIcon />
        {dueDate !== null && showDate && <span className="whitespace-nowrap">{summary}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 z-10 mt-1.5 flex w-56 flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          {choices.map((choice) => {
            const chosen = choice.day === dueDate
            return (
              <button
                key={choice.label}
                type="button"
                aria-pressed={chosen}
                onClick={() => { choose(choice.day) }}
                className={chosen ? `${option} ${optionOn}` : `${option} ${optionOff}`}
              >
                <span aria-hidden="true" className="w-3 shrink-0">
                  {chosen ? '✓' : ''}
                </span>
                <span className="flex-1">{choice.label}</span>
                <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
                  {describeWeekday(choice.day)}
                </span>
              </button>
            )
          })}

          <label className="flex items-center gap-2 border-t border-neutral-200 px-2 pt-1.5 pb-1 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            On
            <input
              type="date"
              value={dueDate ?? ''}
              onChange={(event) => {
                const { value } = event.target
                // Cleared with the field's own control is taking the day away;
                // anything half-typed is not a day yet and waits.
                if (value === '') onChange(null)
                else if (isLocalDay(value)) onChange(value)
              }}
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:[color-scheme:dark]"
            />
          </label>

          {dueDate !== null && (
            <div className="border-t border-neutral-200 pt-0.5 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => { choose(null) }}
                className={`${option} text-neutral-500 dark:text-neutral-400`}
              >
                <span aria-hidden="true" className="w-3 shrink-0" />
                No date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
