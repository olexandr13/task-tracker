import { useLayoutEffect, useRef, useState } from 'react'
import type { LocalDay, LocalTime } from '../../core'
import type { SkipChoice } from '../dateChoices'
import { describeDueAt, describeTimeOfDay } from '../dueLabels'
import { toRepeat, type RepeatDraft } from '../repeatDraft'
import { describeRepeat, describeRepeatBriefly } from '../repeatLabels'
import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { CalendarIcon } from './CalendarIcon'
import { ClockIcon } from './ClockIcon'
import { DueChoices } from './DueChoices'
import { DueTimeChoices } from './DueTimeChoices'
import { PanelBack } from './PanelBack'
import { PanelRow } from './PanelRow'
import { PickerPanel } from './PickerPanel'
import { RepeatChoices } from './RepeatChoices'
import { RepeatIcon } from './RepeatIcon'

/** A day gone by with the task still open reads as a warning, not as information. */
const buttonOverdue = 'bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:text-red-400'

/** What the panel is showing: the day, or one of the groups that hang off it. */
type PanelView = 'date' | 'time' | 'repeat'

interface SchedulePickerProps {
  /**
   * The task's own day, or on a repeating task the day its rule gives it — the
   * occurrence in play, which a rule can have none of yet.
   */
  dueDate: LocalDay | null
  /**
   * The day a repeating task's rule starts on, where one was picked for it. Null
   * on a one-off, whose own day is `dueDate` already.
   */
  startDay?: LocalDay | null
  /** The repeat rule being chosen, `once` when the task happens once. */
  draft: RepeatDraft
  now: Date
  /**
   * The day picked, or taken away: a one-off is due on it, a repeating task
   * starts its rule there. The rule is untouched either way.
   */
  onChangeDay: (day: LocalDay | null) => void
  /** The hour the task is due at, where it is due at one (DUE-19). */
  dueTime?: LocalTime | null
  /** The hour picked, or taken away. The day is untouched either way. */
  onChangeTime: (time: LocalTime | null) => void
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
 * When a task is due: one small button for the day, the hour and the repeat
 * rule, since a rule is what gives a repeating task its days. Its icon says
 * which the task has — the looping arrows for a rule, the calendar otherwise.
 *
 * The panel it opens is **one screenful**, never a column to scroll: the day is
 * on show — quick choices and a month calendar — and the hour and the rule are
 * a line each, saying what they are set to now, opening in the panel's own place
 * when they are asked for and handing it back once there is nothing more to
 * choose. A × on either line takes what it holds away without opening it.
 *
 * There is nothing to confirm: each choice is saved as it is made.
 */
export function SchedulePicker({
  dueDate,
  startDay = null,
  draft,
  now,
  onChangeDay,
  dueTime = null,
  onChangeTime,
  onChangeRepeat,
  skip,
  overdue = false,
  label = 'Schedule',
  showSummary = false,
  align = 'right',
}: SchedulePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<PanelView>('date')
  const root = useRef<HTMLDivElement>(null)
  const timeRow = useRef<HTMLButtonElement>(null)
  const repeatRow = useRef<HTMLButtonElement>(null)
  const backLink = useRef<HTMLButtonElement>(null)
  // Which row a view was opened from, so leaving it puts the focus back there.
  const cameFrom = useRef<PanelView>('date')

  function close() {
    setIsOpen(false)
    setView('date')
    cameFrom.current = 'date'
  }

  // A view opens in the panel's own place, so the focus goes with it — onto the
  // way back out, and back onto the row that opened it on the way in.
  useLayoutEffect(() => {
    if (!isOpen) return

    if (view !== 'date') {
      backLink.current?.focus({ preventScroll: true })
    } else if (cameFrom.current !== 'date') {
      const row = cameFrom.current === 'time' ? timeRow.current : repeatRow.current
      row?.focus({ preventScroll: true })
    }
    cameFrom.current = view
  }, [isOpen, view])

  const rule = toRepeat(draft)
  // The hour rides with the day it falls on — "Tomorrow at 9:00 AM" — and has
  // nothing to say on its own, a task with no day having no moment to be due at.
  const day = dueDate === null ? null : describeDueAt(dueDate, dueTime, now)
  // A rule can have no day in play yet: a Monday task written on a Tuesday.
  // Spoken and in the tooltip in full; beside the repeat icon, briefly (RPT-24).
  const summarize = (describe: typeof describeRepeat) =>
    rule === null ? (day ?? 'No date') : day === null ? describe(rule) : `${describe(rule)} · ${day}`
  const summary = summarize(describeRepeat)
  const scheduled = rule !== null || dueDate !== null
  // A rule gives the task days of its own, so an hour has one to fall on from the start.
  const hasDay = rule !== null || dueDate !== null

  const named = scheduled && showSummary
  // The add box spells the day out beside the title without taking its space,
  // so a named button is sized by its own content too (DUE-4, rowControls).
  const button = showSummary ? rowControlLabel : rowControlIcon

  return (
    <div
      ref={root}
      className="relative min-w-0 shrink"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !isOpen) return
        event.stopPropagation()
        // Escape steps back out of a group first, the panel itself being what it was opened from.
        if (view === 'date') close()
        else setView('date')
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (isOpen) close()
          else setIsOpen(true)
        }}
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
        <PickerPanel
          anchor={root}
          label={label}
          align={align}
          width="w-[min(20rem,calc(100vw-2rem))] md:w-64"
          content="gap-0.5 p-1.5 md:p-1"
          showing={view}
          onClose={close}
        >
          {view === 'date' && (
            <>
              <DueChoices
                dueDate={dueDate}
                chosen={rule === null ? dueDate : startDay}
                now={now}
                repeats={rule !== null}
                skip={skip}
                onChange={onChangeDay}
                onDone={close}
              />

              {/* What hangs on the day, a line each: on show as what it is set to,
                  and a tap from the choices themselves, so the panel stays one screenful. */}
              <div className="flex flex-col gap-0.5 border-t border-neutral-200 pt-1 dark:border-neutral-800">
                <PanelRow
                  ref={timeRow}
                  icon={<ClockIcon />}
                  name="Time"
                  value={dueTime === null ? null : describeTimeOfDay(dueTime, now)}
                  empty={hasDay ? 'Any time' : 'Pick a day first'}
                  hint={
                    hasDay
                      ? undefined
                      : 'Pick a day above, and you can set a time on it.'
                  }
                  onOpen={hasDay ? () => { setView('time') } : undefined}
                  onClear={dueTime === null ? undefined : () => { onChangeTime(null) }}
                />
                <PanelRow
                  ref={repeatRow}
                  icon={<RepeatIcon />}
                  name="Repeat"
                  value={rule === null ? null : describeRepeat(rule)}
                  empty="Once"
                  onOpen={() => { setView('repeat') }}
                  onClear={rule === null ? undefined : () => { onChangeRepeat({ ...draft, kind: 'once' }) }}
                />
              </div>
            </>
          )}

          {view === 'time' && (
            <>
              <PanelBack ref={backLink} name="Time" onBack={() => { setView('date') }} />
              <div className="border-t border-neutral-200 dark:border-neutral-800">
                <DueTimeChoices
                  dueTime={dueTime}
                  now={now}
                  hasDay={hasDay}
                  named={false}
                  onChange={onChangeTime}
                  onDone={() => { setView('date') }}
                />
              </div>
            </>
          )}

          {view === 'repeat' && (
            <>
              <PanelBack ref={backLink} name="Repeat" onBack={() => { setView('date') }} />
              <div className="flex flex-col gap-0.5 border-t border-neutral-200 pt-1 dark:border-neutral-800">
                <RepeatChoices
                  draft={draft}
                  onChange={onChangeRepeat}
                  named={false}
                  onDone={() => { setView('date') }}
                />
              </div>
            </>
          )}
        </PickerPanel>
      )}
    </div>
  )
}
