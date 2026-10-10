import { useId, useState, type KeyboardEvent } from 'react'
import {
  isSessionLength,
  MAX_SESSION_MINUTES,
  MAX_TIME_COMMENT_LENGTH,
  type TimeEntry,
  type TimeEntryId,
} from '../../core'
import { describeDuration, describeLoggedAt, describeSessionLength, LENGTH_EXAMPLES, parseDuration } from '../durationLabels'
import { deleteControl } from '../rowControls'
import { CommentIcon } from './CommentIcon'
import { InfoButton } from './InfoButton'

/**
 * Logging time by hand and the sessions logged, as a panel lays them out: a
 * task's clock (TimePicker, TIME-3) and a Balance category's (BAL-14) — so the
 * two read and work the same.
 */

/** The sessions offered at a click, being the lengths most often logged. */
const QUICK_SESSIONS: readonly number[] = [5, 15, 30, 60]

/**
 * A quick session, and Log beside the box. Filled rather than bare, so on a
 * phone, where nothing hovers, it still reads as a button and not as a label.
 */
const chip =
  'grid h-10 min-w-0 place-items-center rounded-xl bg-neutral-100 px-3 text-sm font-medium text-neutral-700 tabular-nums transition-colors hover:bg-neutral-200 hover:text-neutral-900 active:bg-neutral-200 disabled:pointer-events-none disabled:opacity-40 md:h-7 md:rounded-lg md:px-2 md:text-xs dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:active:bg-neutral-700'

/** The name over a part of the panel, for the eye; the part carries it for a screen reader. */
const heading = 'px-1 text-xs font-medium text-neutral-400 md:text-[11px] dark:text-neutral-500'

/** What to type, as typed, in the **i**'s sheet. */
const typedExample =
  'rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[13px] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'

/** The quick sessions as their buttons read, for a sentence: `"+5m", "+15m", "+30m" or "+1h"`. */
const quickNames = QUICK_SESSIONS.map((minutes) => `"+${describeDuration(minutes)}"`)
const quickList = `${quickNames.slice(0, -1).join(', ')} or ${quickNames.at(-1) ?? ''}`

/** The line between one part of a time panel and the next. */
export const timeDivider = 'border-t border-neutral-200 pt-3 md:pt-2 dark:border-neutral-800'

/** A box in a time panel. */
export const timeField =
  'min-w-0 rounded-xl border border-neutral-300 bg-transparent px-3 py-2 text-base text-neutral-900 tabular-nums placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none aria-invalid:border-red-500 md:rounded-lg md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'

interface LogTimeFieldsProps {
  /** What the next session logged went on, as typed (TIME-23); the caller keeps it, to send with the session. */
  comment: string
  onCommentChange: (comment: string) => void
  /** A session logged by hand, in whole minutes. */
  onLog: (minutes: number) => void
  /** What the comment box says it is for when pointed at. */
  commentHint?: string
}

/**
 * **Log time**: the quick sessions, a box for any other length — `25m`, `1h`,
 * `1:30` — logged on Enter or Log, and under them the comment (TIME-23). What
 * the box understands is behind the **i** by the heading, not crammed into the
 * box. A length that cannot be read marks its box and says what would do, until
 * it is changed (TIME-11).
 */
export function LogTimeFields({
  comment,
  onCommentChange,
  onLog,
  commentHint = 'Saved with the next time you log, or with Stop.',
}: LogTimeFieldsProps) {
  const [session, setSession] = useState('')
  const [isSessionInvalid, setIsSessionInvalid] = useState(false)
  const ids = useId()
  const logHeading = `${ids}-log`
  const sessionHint = `${ids}-hint`

  /** Logs the length typed, when it is one; anything else marks the box and says what would do. */
  function logTyped() {
    if (session.trim() === '') return

    const minutes = parseDuration(session)
    if (minutes === null || !isSessionLength(minutes)) {
      setIsSessionInvalid(true)
      return
    }
    onLog(minutes)
    setSession('')
  }

  function handleSessionKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    logTyped()
  }

  function handleCommentKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    // Enter logs the length typed, when there is one; a comment alone is nothing to log.
    event.preventDefault()
    logTyped()
  }

  return (
    <div role="group" aria-labelledby={logHeading} className="flex flex-col gap-1.5 md:gap-1">
      <div className="flex items-center gap-1">
        <p id={logHeading} className={heading}>
          Log time
        </p>
        <InfoButton label="Log time" heading="Logging time">
          <p>Press {quickList} to log that much straight away.</p>
          <p>For any other length, type it in the box under them, then press "Log" or Enter.</p>
          <h3 className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">What you can type</h3>
          <ul className="flex flex-col gap-1.5">
            {LENGTH_EXAMPLES.map(({ typed, means }) => (
              <li key={means} className="flex items-baseline gap-3">
                <span className="flex w-28 shrink-0 flex-wrap gap-1">
                  {typed.map((text) => (
                    <span key={text} className={typedExample}>
                      {text}
                    </span>
                  ))}
                </span>
                <span>{means}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1">A session can be anything from 1 minute up to {MAX_SESSION_MINUTES / 60} hours.</p>
        </InfoButton>
      </div>
      <div className="grid grid-cols-4 gap-1.5 md:gap-1">
        {QUICK_SESSIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => { onLog(minutes) }}
            aria-label={`Log ${describeDuration(minutes)}`}
            className={chip}
          >
            +{describeDuration(minutes)}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 md:gap-1">
        <input
          type="text"
          name="time-session"
          value={session}
          onChange={(event) => {
            setSession(event.target.value)
            setIsSessionInvalid(false)
          }}
          onKeyDown={handleSessionKeyDown}
          aria-label="Time to log"
          aria-invalid={isSessionInvalid}
          aria-describedby={isSessionInvalid ? sessionHint : undefined}
          autoComplete="off"
          enterKeyHint="done"
          className={`${timeField} w-full flex-1`}
        />
        <button
          type="button"
          onClick={logTyped}
          disabled={session.trim() === ''}
          className={chip}
        >
          Log
        </button>
      </div>
      {isSessionInvalid && (
        <p id={sessionHint} className="px-1 text-xs text-red-600 dark:text-red-400">
          Try 25m, 1h30 or 1:30, up to 24h.
        </p>
      )}
      {/* Words, not a length: shaded, with a speech bubble, unlike the outlined box above. */}
      <label className="mt-1 flex items-center gap-2 rounded-xl border border-transparent bg-neutral-100/70 px-3 text-neutral-400 transition-colors focus-within:border-blue-500 focus-within:text-blue-500 md:gap-1.5 md:rounded-lg md:px-2 dark:bg-white/5 dark:text-neutral-500 dark:focus-within:border-blue-400 dark:focus-within:text-blue-400 [&>svg]:size-4 md:[&>svg]:size-3.5">
        <CommentIcon />
        <input
          type="text"
          name="time-comment"
          value={comment}
          onChange={(event) => { onCommentChange(event.target.value) }}
          onKeyDown={handleCommentKeyDown}
          maxLength={MAX_TIME_COMMENT_LENGTH}
          placeholder="Add a comment (optional)"
          aria-label="Comment on the time logged"
          title={commentHint}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none md:py-1 md:text-sm dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </label>
    </div>
  )
}

interface SessionListProps {
  /** The sessions to list, in the order they are shown. */
  sessions: readonly TimeEntry[]
  /** The moment they are read for, to say when each was logged. */
  now: Date
  onRemove: (entryId: TimeEntryId) => void
  /** The name over the list. */
  label?: string
}

/**
 * The sessions logged, under a line (TIME-4): each with when it was logged —
 * its time today, its date and time before that — its comment under that when
 * it has one, its length, and an **×** taking it back. A long list scrolls
 * inside the panel.
 */
export function SessionList({ sessions, now, onRemove, label = 'Sessions' }: SessionListProps) {
  const headingId = useId()

  return (
    <div className={`flex flex-col gap-1 ${timeDivider}`}>
      <p id={headingId} className={heading}>
        {label}
      </p>
      <ul aria-labelledby={headingId} className="flex max-h-40 flex-col overflow-y-auto overscroll-contain md:max-h-32">
        {sessions.map((entry) => {
          const at = describeLoggedAt(entry.loggedAt, now)
          return (
            <li key={entry.id} className="flex items-center gap-2 pl-1 text-sm md:text-xs">
              <span className="flex min-w-0 flex-col">
                <span className="text-neutral-500 tabular-nums dark:text-neutral-400">{at}</span>
                {entry.comment !== null && (
                  <span className="break-words text-neutral-800 dark:text-neutral-200">{entry.comment}</span>
                )}
              </span>
              <span className="ml-auto font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                {describeSessionLength(entry.seconds)}
              </span>
              <button
                type="button"
                onClick={() => { onRemove(entry.id) }}
                aria-label={`Remove ${describeSessionLength(entry.seconds)} logged at ${at}`}
                className={`grid size-8 shrink-0 place-items-center rounded-lg text-base leading-none md:size-5 md:rounded-md md:text-sm ${deleteControl}`}
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
