import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent } from 'react'
import {
  elapsedSeconds,
  isTimeGoal,
  sessionSeconds,
  wholeMinutes,
  type TimeEntry,
  type TimeEntryId,
} from '../../core'
import { describeDuration, describeElapsedClock, describeTimeSummary, parseDuration } from '../durationLabels'
import { controlOff, controlOn, controlRunning, detailReached, rowControlIcon } from '../rowControls'
import { ClockIcon } from './ClockIcon'
import { PickerPanel } from './PickerPanel'
import { PlayIcon } from './PlayIcon'
import { StopIcon } from './StopIcon'
import { LogTimeFields, SessionList, timeDivider, timeField } from './TimeLogFields'

interface TimePickerProps {
  /** The minutes the task asks for, or null for none. */
  goal: number | null
  /** The sessions that count as of `now`, oldest first. */
  sessions: readonly TimeEntry[]
  /** The moment the sessions are read for, to say when each was logged. */
  now: Date
  /** A session logged by hand, with the comment typed for it or null for none (TIME-23). */
  onLog: (minutes: number, comment: string | null) => void
  onRemove: (entryId: TimeEntryId) => void
  onChangeGoal: (minutes: number | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
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
    /** Ends the run, logging it with the comment typed for it or null for none (TIME-23). */
    readonly onStop: (comment: string | null) => void
  }
  /** Opens the panel as a tap on the clock would, once the clock is drawn (TIME-20). */
  startOpen?: boolean
}

/**
 * A task's time: a small clock that opens a panel for logging sessions against
 * the task's goal, seeing how far along it is, and setting the goal itself.
 *
 * Like the other pickers there is nothing to confirm. A quick session is logged
 * as it is clicked, and one typed — `25m`, `1h`, `1:30` — on Enter or Log. The goal is
 * kept on Enter or on leaving the panel, and an empty goal is none; Escape drops
 * a goal half-typed. Start/Stop runs a timer that becomes a session on Stop. A
 * comment typed goes with the next session logged here, by hand or by Stop.
 */
export function TimePicker({
  goal,
  sessions,
  now,
  onLog,
  onRemove,
  onChangeGoal,
  label = 'Time',
  align = 'right',
  timer,
  startOpen = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // What the next session logged here went on (TIME-23); spaces alone say nothing.
  const [comment, setComment] = useState('')
  // What is typed as the goal starts as the goal, and is only kept once it is
  // left or Enter is pressed: `1h30` passes through `1` on the way.
  const [goalText, setGoalText] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const said = comment.trim() === '' ? null : comment.trim()

  const spentSeconds = sessionSeconds(sessions)
  const liveSeconds =
    timer?.running === true && timer.startedAt !== null
      ? elapsedSeconds(timer.startedAt, timer.clock)
      : 0
  // Logged and live time add up to the second; only the total is read in minutes.
  const shownSpent = wholeMinutes(spentSeconds + liveSeconds)
  const reached = goal !== null && shownSpent >= goal
  const summary = describeTimeSummary(shownSpent, goal)
  const isSet = goal !== null || spentSeconds > 0 || (timer?.running ?? false)
  const typedGoal = goalText.trim() === '' ? null : parseDuration(goalText)
  const isGoalInvalid = goalText.trim() !== '' && (typedGoal === null || !isTimeGoal(typedGoal))
  const running = timer?.running === true

  // Named (sheet) fills its row so the whole line is the hit target (UI-59);
  // icon-only stays content-sized for a woken strip.
  const button = `${rowControlIcon} w-full`
  const buttonTone = running ? controlRunning : isSet ? controlOn : controlOff

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

  function toggle() {
    if (isOpen) {
      close()
      return
    }
    setComment('')
    setGoalText(goal === null ? '' : describeDuration(goal))
    setIsOpen(true)
  }

  /** Logs a session with the comment typed, which then goes: it was this session's. */
  function log(minutes: number) {
    onLog(minutes, said)
    setComment('')
  }

  // After the clock is drawn rather than with it: the panel reads off the page
  // whether it opens inside a sheet, and so as a sheet of its own (UI-64).
  const openAtStart = useEffectEvent(() => {
    if (!isOpen) toggle()
  })

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- the clock has to be on the page before its panel opens
    if (startOpen) openAtStart()
  }, [startOpen])

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
      className="relative min-w-0 shrink"
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
      </button>

      {isOpen && (
        <PickerPanel
          anchor={root}
          label={label}
          align={align}
          width="w-[min(22rem,calc(100vw-2rem))] md:w-60"
          content="gap-3 rounded-2xl p-3 md:gap-2 md:rounded-xl md:p-2"
          onClose={close}
        >
          <div className="flex flex-col gap-2 px-1 md:gap-1.5">
            <div className="flex items-baseline gap-2">
              <p
                aria-live="polite"
                className={`text-xl font-semibold tabular-nums md:text-base ${reached ? detailReached : 'text-neutral-900 dark:text-neutral-100'}`}
              >
                {describeDuration(shownSpent)}
                <span className="text-sm font-normal text-neutral-500 md:text-xs dark:text-neutral-400">
                  {goal === null ? ' spent' : ` of ${describeDuration(goal)}`}
                </span>
              </p>
              {goal !== null && (
                <p
                  className={`ml-auto text-sm tabular-nums md:text-xs ${reached ? `font-medium ${detailReached}` : 'text-neutral-500 dark:text-neutral-400'}`}
                >
                  {reached ? 'Goal reached ✓' : `${describeDuration(goal - shownSpent)} left`}
                </p>
              )}
            </div>

            {goal !== null && (
              <div
                role="progressbar"
                aria-label="Toward the goal"
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-valuenow={Math.min(shownSpent, goal)}
                aria-valuetext={summary}
                className="h-2 overflow-hidden rounded-full bg-neutral-100 md:h-1.5 dark:bg-neutral-800"
              >
                <div
                  className={`h-full rounded-full transition-[width] ${reached ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-400'}`}
                  style={{ width: `${String(Math.min(100, (shownSpent / goal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {timer !== undefined &&
            (running ? (
              <div
                role="group"
                aria-label="Timer"
                className="flex h-11 items-center gap-2.5 rounded-xl bg-blue-600/10 pr-1.5 pl-3.5 md:h-8 md:gap-2 md:rounded-lg md:pr-1 md:pl-2.5 dark:bg-blue-400/10"
              >
                <span aria-hidden="true" className="task-timer-running size-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span
                  role="timer"
                  className="text-lg font-semibold tabular-nums text-blue-700 md:text-sm dark:text-blue-300"
                >
                  {describeElapsedClock(liveSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    timer.onStop(said)
                    setComment('')
                  }}
                  className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 active:bg-red-700 md:h-6 md:rounded-md md:px-2 md:text-xs dark:bg-red-500 dark:hover:bg-red-400 [&>svg]:size-3.5 md:[&>svg]:size-3"
                >
                  <StopIcon />
                  Stop
                </button>
              </div>
            ) : (
              <div role="group" aria-label="Timer">
                <button
                  type="button"
                  onClick={() => { timer.onStart() }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-700 md:h-8 md:gap-1.5 md:rounded-lg md:text-sm dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-400 [&>svg]:size-4 md:[&>svg]:size-3.5"
                >
                  <PlayIcon />
                  Start timer
                </button>
              </div>
            ))}

          <LogTimeFields comment={comment} onCommentChange={setComment} onLog={log} />

          {sessions.length > 0 && <SessionList sessions={sessions} now={now} onRemove={onRemove} />}

          <label className={`flex items-center gap-2 px-1 text-sm text-neutral-600 md:text-xs dark:text-neutral-300 ${timeDivider}`}>
            Goal
            <input
              type="text"
              name="time-goal"
              value={goalText}
              onChange={(event) => { setGoalText(event.target.value) }}
              onKeyDown={handleGoalKeyDown}
              placeholder="None"
              aria-invalid={isGoalInvalid}
              title="How long it takes, such as 1h. Empty for none."
              autoComplete="off"
              enterKeyHint="done"
              className={`${timeField} ml-auto w-24 text-right md:w-20`}
            />
          </label>
        </PickerPanel>
      )}
    </div>
  )
}
