import { useEffect, useRef, useState } from 'react'
import type { LocalDay } from '../../core'
import type { SkipChoice } from '../dateChoices'
import { describeDueDate } from '../dueLabels'
import { toRepeat, type RepeatDraft } from '../repeatDraft'
import { describeRepeat, describeRepeatBriefly } from '../repeatLabels'
import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { CalendarIcon } from './CalendarIcon'
import { DueChoices } from './DueChoices'
import { RepeatChoices } from './RepeatChoices'
import { RepeatIcon } from './RepeatIcon'

/** A day gone by with the task still open reads as a warning, not as information. */
const buttonOverdue = 'bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:text-red-400'

interface SchedulePickerProps {
  /**
   * The task's own day, or on a repeating task the day its rule gives it — the
   * occurrence in play, which a rule can have none of yet.
   */
  dueDate: LocalDay | null
  /** The repeat rule being chosen, `once` when the task happens once. */
  draft: RepeatDraft
  now: Date
  /**
   * A day picked, or taken away. A day picked on a repeating task ends its rule;
   * moving the draft back to `once` is the caller's, which owns it.
   */
  onChangeDueDate: (dueDate: LocalDay | null) => void
  onChangeRepeat: (draft: RepeatDraft) => void
  /** Passing over a repeating task's occurrence, where it has one to pass over. */
  skip?: SkipChoice
  /** Due on a day already gone and still to do. */
  overdue?: boolean
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /**
   * Whether the button spells the date or the rule out beside its icon. Off, it
   * is the icon alone, still tinted, with them as its name and tooltip.
   */
  showSummary?: boolean
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * When a task is due: one small button for both the day and the repeat rule,
 * since a rule is what gives a repeating task its days. Its icon says which the
 * task has — the looping arrows for a rule, the calendar otherwise — and it
 * opens one panel with the date choices and a month calendar over the repeat ones.
 *
 * There is nothing to confirm: each choice is saved as it is made.
 */
export function SchedulePicker({
  dueDate,
  draft,
  now,
  onChangeDueDate,
  onChangeRepeat,
  skip,
  overdue = false,
  label = 'Schedule',
  showSummary = false,
  align = 'right',
}: SchedulePickerProps) {
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

  const rule = toRepeat(draft)
  const day = dueDate === null ? null : describeDueDate(dueDate, now)
  // A rule can have no day in play yet: a Monday task written on a Tuesday.
  // Spoken and in the tooltip in full; beside the repeat icon, briefly (RPT-24).
  const summarize = (describe: typeof describeRepeat) =>
    rule === null ? (day ?? 'No date') : day === null ? describe(rule) : `${describe(rule)} · ${day}`
  const summary = summarize(describeRepeat)
  const scheduled = rule !== null || dueDate !== null

  // Named (sheet) fills its row so the whole line is the hit target (UI-59);
  // icon-only stays content-sized for a woken strip.
  const named = scheduled && showSummary
  const button = `${showSummary ? rowControlLabel : rowControlIcon} w-full`
  const rootClass = showSummary ? 'relative min-w-0 w-full' : 'relative min-w-0 shrink'

  return (
    <div
      ref={root}
      className={rootClass}
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
          !scheduled ? `${button} ${controlOff}` : overdue ? `${button} ${buttonOverdue}` : `${button} ${controlOn}`
        }
      >
        {rule === null ? <CalendarIcon /> : <RepeatIcon />}
        {showSummary && (
          <span className="min-w-0 truncate">
            {named ? summarize(describeRepeatBriefly) : 'No date'}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-1.5 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl md:w-64 md:p-1 dark:border-neutral-700 dark:bg-neutral-900`}
        >
          <DueChoices
            dueDate={dueDate}
            now={now}
            repeats={rule !== null}
            skip={skip}
            onChange={onChangeDueDate}
            onDone={() => { setIsOpen(false) }}
          />

          <div className="flex flex-col gap-0.5 border-t border-neutral-200 pt-1 dark:border-neutral-800">
            <RepeatChoices draft={draft} onChange={onChangeRepeat} onDone={() => { setIsOpen(false) }} />
          </div>
        </div>
      )}
    </div>
  )
}
