import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent } from 'react'
import { elapsedMinutesFloor, elapsedSeconds, isSessionLength, isTimeGoal, type TimeEntry, type TimeEntryId } from '../../core'
import {
  describeDuration,
  describeElapsedClock,
  describeLoggedAt,
  describeTimeSummary,
  parseDuration,
} from '../durationLabels'
import { panelStep } from '../panelControls'
import { controlOff, controlOn, controlRunning, deleteControl, detailReached, rowControlIcon, rowControlLabel } from '../rowControls'
import { ClockIcon } from './ClockIcon'

/** The sessions offered at a click, being the lengths most often logged. */
const QUICK_SESSIONS: readonly number[] = [5, 15, 30, 60]

/** A quick session: a panel's step button, widened to hold its words. */
const quickButton = `${panelStep} w-auto px-2 text-sm tabular-nums md:px-1.5 md:text-xs`

const field =
  'min-w-0 rounded-xl border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 tabular-nums placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none aria-invalid:border-red-500 md:rounded-lg md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'

interface TimePickerProps {
  /** The minutes the task asks for, or null for none. */
  goal: number | null
  /** The sessions that count as of `now`, oldest first. */
  sessions: readonly TimeEntry[]
  /** The moment the sessions are read for, to say when each was logged. */
  now: Date
  onLog: (minutes: number) => void
  onRemove: (entryId: TimeEntryId) => void
  onChangeGoal: (minutes: number | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** Whether the button spells the time out beside its clock, or a way to add some when there is none. */
  showAmount?: boolean
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
  /**
   * A live timer for this task, when the screen offers one. Without it the
   * panel only logs sessions by hand (as when adding a task that has no id yet).
   */
  timer?: {
    readonly running: boolean
    readonly startedAt: string | null
    /** Wall clock while the timer ticks; ignored when not running. */
    readonly clock: Date
    readonly onStart: () => void
    readonly onStop: () => void
  }
}

/**
 * A task's time: a small clock that opens a panel for logging sessions against
 * the task's goal, seeing how far along it is, and setting the goal itself.
 *
 * Like the other pickers there is nothing to confirm. A quick session is logged
 * as it is clicked, and one typed — `25m`, `1h`, `1:30` — on Enter. The goal is
 * kept on Enter or on leaving the panel, and an empty goal is none; Escape drops
 * a goal half-typed. Start/Stop runs a timer that becomes a session on Stop.
 */
export function TimePicker({
  goal,
  sessions,
  now,
  onLog,
  onRemove,
  onChangeGoal,
  label = 'Time',
  showAmount = false,
  align = 'right',
  timer,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // What is typed into each box. The goal's starts as the goal, and is only
  // kept once it is left or Enter is pressed: `1h30` passes through `1` on the way.
  const [session, setSession] = useState('')
  const [goalText, setGoalText] = useState('')
  const [isSessionInvalid, setIsSessionInvalid] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const spent = sessions.reduce((total, entry) => total + entry.minutes, 0)
  const liveSeconds =
    timer?.running === true && timer.startedAt !== null
      ? elapsedSeconds(timer.startedAt, timer.clock)
      : 0
  const liveMinutes = timer?.running === true && timer.startedAt !== null
    ? elapsedMinutesFloor(timer.startedAt, timer.clock)
    : 0
  const shownSpent = spent + liveMinutes
  const reached = goal !== null && shownSpent >= goal
  const summary = describeTimeSummary(shownSpent, goal)
  const isSet = goal !== null || spent > 0 || (timer?.running ?? false)
  const typedGoal = goalText.trim() === '' ? null : parseDuration(goalText)
  const isGoalInvalid = goalText.trim() !== '' && (typedGoal === null || !isTimeGoal(typedGoal))
  const running = timer?.running === true

  // Named (sheet) fills its row so the whole line is the hit target (UI-59);
  // icon-only stays content-sized for a woken strip.
  const button = `${showAmount ? rowControlLabel : rowControlIcon} w-full`
  const buttonTone = running ? controlRunning : isSet ? controlOn : controlOff
  const rootClass = showAmount ? 'relative min-w-0 w-full' : 'relative min-w-0 shrink'

  /** Keeps the goal typed, when it is one; anything else goes back to what is saved. */
  function commitGoal() {
    if (isGoalInvalid) {
      setGoalText(goal === null ? '' : describeDuration(goal))
      return
    }
    if (typedGoal !== goal) onChangeGoal(typedGoal)
  }

  /** Leaving the panel keeps what was typed as the goal, as leaving any box does. */
  function close() {
    commitGoal()
    setIsOpen(false)
  }

  const onPointerDownOutside = useEffectEvent(close)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) onPointerDownOutside()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  function toggle() {
    if (isOpen) {
      close()
      return
    }
    setSession('')
    setIsSessionInvalid(false)
    setGoalText(goal === null ? '' : describeDuration(goal))
    setIsOpen(true)
  }

  function handleSessionKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (session.trim() === '') return

    const minutes = parseDuration(session)
    if (minutes === null || !isSessionLength(minutes)) {
      setIsSessionInvalid(true)
      return
    }
    onLog(minutes)
    setSession('')
  }

  function handleGoalKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    close()
  }

  const amountLabel = running
    ? `${summary}, timer running ${describeElapsedClock(liveSeconds)}`
    : summary

  return (
    <div
      ref={root}
      className={rootClass}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          // Escape drops the goal half-typed rather than keeping it.
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}: ${amountLabel}`}
        title={isSet ? amountLabel : 'Log time'}
        className={`${button} ${buttonTone}`}
      >
        <ClockIcon />
        {showAmount && (
          <span className={reached ? `min-w-0 truncate ${detailReached}` : 'min-w-0 truncate'}>
            {isSet ? (running ? describeElapsedClock(liveSeconds) : summary) : 'Log time'}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-1.5 flex w-[min(19rem,calc(100vw-2rem))] flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl md:w-60 md:gap-1.5 md:p-1.5 dark:border-neutral-700 dark:bg-neutral-900`}
        >
          <div className="flex items-baseline justify-between gap-2 px-1 pt-0.5">
            <p className="text-sm text-neutral-500 md:text-xs dark:text-neutral-400">Time spent</p>
            <p
              aria-live="polite"
              className={`text-base tabular-nums md:text-sm ${reached ? detailReached : 'text-neutral-900 dark:text-neutral-100'}`}
            >
              {goal === null ? describeDuration(shownSpent) : summary}
            </p>
          </div>

          {goal !== null && (
            <div
              role="progressbar"
              aria-label="Toward the goal"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={Math.min(shownSpent, goal)}
              aria-valuetext={summary}
              className="mx-1 h-2 overflow-hidden rounded-full bg-neutral-100 md:h-1.5 dark:bg-neutral-800"
            >
              <div
                className={`h-full rounded-full transition-[width] ${reached ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-400'}`}
                style={{ width: `${String(Math.min(100, (shownSpent / goal) * 100))}%` }}
              />
            </div>
          )}

          {reached && <p className={`px-1 text-sm md:text-xs ${detailReached}`}>Goal reached. Ready to tick off.</p>}

          {timer !== undefined && (
            <div role="group" aria-label="Timer" className="flex items-center justify-end gap-2 px-0.5">
              {running && (
                <p
                  aria-live="polite"
                  className="text-sm tabular-nums text-blue-700 md:text-xs dark:text-blue-300"
                >
                  {describeElapsedClock(liveSeconds)}
                </p>
              )}
              {running ? (
                <button
                  type="button"
                  onClick={() => { timer.onStop() }}
                  className="shrink-0 rounded-lg bg-red-600/90 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 md:rounded-md md:px-2 md:py-0.5 md:text-xs dark:bg-red-500/90 dark:hover:bg-red-400"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { timer.onStart() }}
                  className="shrink-0 rounded-lg bg-blue-600/90 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 md:rounded-md md:px-2 md:py-0.5 md:text-xs dark:bg-blue-500/90 dark:hover:bg-blue-400"
                >
                  Start timer
                </button>
              )}
            </div>
          )}

          <div role="group" aria-label="Log time" className="flex flex-wrap items-center gap-1.5 md:gap-1">
            {QUICK_SESSIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => { onLog(minutes) }}
                aria-label={`Log ${describeDuration(minutes)}`}
                className={quickButton}
              >
                +{describeDuration(minutes)}
              </button>
            ))}
            <input
              type="text"
              value={session}
              onChange={(event) => {
                setSession(event.target.value)
                setIsSessionInvalid(false)
              }}
              onKeyDown={handleSessionKeyDown}
              placeholder="25m"
              aria-label="Time to log"
              aria-invalid={isSessionInvalid}
              title="Minutes, or 1h, 1h30, 1:30. Enter logs it."
              autoComplete="off"
              enterKeyHint="done"
              className={`${field} w-full flex-1`}
            />
          </div>

          {sessions.length > 0 && (
            <ul
              aria-label="Sessions"
              className="flex flex-col border-t border-neutral-200 pt-1.5 md:pt-1 dark:border-neutral-800"
            >
              {sessions.map((entry) => {
                const at = describeLoggedAt(entry.loggedAt, now)
                return (
                  <li key={entry.id} className="flex items-center gap-2 py-1 pl-1 text-sm md:py-0 md:text-xs">
                    <span className="text-neutral-500 tabular-nums dark:text-neutral-400">{at}</span>
                    <span className="ml-auto text-neutral-900 tabular-nums dark:text-neutral-100">
                      {describeDuration(entry.minutes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => { onRemove(entry.id) }}
                      aria-label={`Remove ${describeDuration(entry.minutes)} logged at ${at}`}
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-base leading-none md:size-5 md:rounded-md md:text-sm ${deleteControl}`}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <label className="flex items-center gap-2 border-t border-neutral-200 px-1 pt-2 text-sm text-neutral-500 md:pt-1.5 md:text-xs dark:border-neutral-800 dark:text-neutral-400">
            Goal
            <input
              type="text"
              value={goalText}
              onChange={(event) => { setGoalText(event.target.value) }}
              onKeyDown={handleGoalKeyDown}
              placeholder="None"
              aria-invalid={isGoalInvalid}
              title="How long it takes, such as 1h. Empty for none."
              autoComplete="off"
              enterKeyHint="done"
              className={`${field} ml-auto w-28 text-right md:w-24`}
            />
          </label>
        </div>
      )}
    </div>
  )
}
