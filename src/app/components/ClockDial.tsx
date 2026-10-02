import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import type { LocalTime } from '../../core'
import { describeTimeOfDay } from '../dueLabels'
import {
  comingHour,
  DAY_HOURS,
  DIAL_STEPS,
  HOUR_LABELS,
  hourAt,
  MINUTE_LABELS,
  ringAtDistance,
  ringOf,
  RING_RADIUS,
  stepAtPoint,
  stepOf,
  stepOffset,
  timeParts,
  withHour,
  withMinute,
  wrapStep,
  type DialRing,
  type DialUnit,
} from '../clockDial'

/** A number on the face. Sized for a thumb, and smaller on a wide screen as panels are (UI-40). */
const label =
  'absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500'

/** The two rings' numbers, the inner ring's smaller for sitting on a shorter circle. */
const ringLabel: Readonly<Record<DialRing, string>> = {
  outer: 'size-8 text-sm md:size-7 md:text-[13px]',
  inner: 'size-7 text-xs md:size-6 md:text-[11px]',
}

const labelOff = 'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700'

/** The number the hand rests on, filled as the chosen day is in the calendar (DUE-15). */
const labelOn = 'bg-blue-600 font-semibold text-white dark:bg-blue-500'

/** Half of the readout — the hour, or the minutes — and what switches the face to it. */
const readout =
  'rounded-xl px-2 py-0.5 text-3xl font-semibold tabular-nums transition-colors md:rounded-lg md:text-2xl'

const readoutOn = 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'

const readoutOff = 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'

/** Where a key takes the hand from `value`, or null for a key that leaves it be. */
function moveByKey(event: KeyboardEvent, value: number, around: number): number | null {
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return wrapStep(value + 1, around)
    case 'ArrowDown':
    case 'ArrowLeft':
      return wrapStep(value - 1, around)
    case 'Home':
      return 0
    default:
      return null
  }
}

interface ClockDialProps {
  /** The hour the task is due at, or null while it has none and the face stands empty. */
  value: LocalTime | null
  /** The moment the face opens against, when there is no hour to open on. */
  now: Date
  /** Whole hours only, as a check-in's hours are (CHECKIN-2): the minutes stay at :00, and the face on the hours. */
  hoursOnly?: boolean
  onChange: (time: LocalTime) => void
}

/**
 * A clock face for the hour a task is due at (DUE-24): the hour is picked off
 * the face, the minutes off the same face after it, and the readout above says
 * what the two make. Either half of the readout puts the face back on it, so an
 * hour set a minute ago is changed without starting again.
 *
 * The face keeps the day's twenty-four hours in two rings — the morning outside,
 * the afternoon and evening inside — so the hour picked is the hour of the day
 * and there is no half of the day to say after it.
 *
 * The face answers a click on a number, a hand dragged round it, and the arrow
 * keys, which move the hand an hour or a minute at a time and come round the day
 * rather than stopping at its ends. A tap lands on the number tapped; a drag
 * reads every minute, so 7:05 and 7:07 are both an ordinary movement away.
 *
 * There is nothing to confirm, as in the other pickers: the hour is set as it is
 * picked, and picking the hour hands the face to the minutes, which is what is
 * left to say.
 */
export function ClockDial({ value, now, hoursOnly = false, onChange }: ClockDialProps) {
  const [unit, setUnit] = useState<DialUnit>('hour')
  // Where the keys start out when the task has no hour: the hour coming, which is
  // the likeliest one. Nothing is set by resting there, and it never moves after.
  const [start] = useState<LocalTime>(() => comingHour(now))
  const face = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const moved = useRef(false)
  // Whether a pointer is what is working the face. A click it leaves behind has
  // been answered as it went down, and is not answered again; one from the
  // keyboard — Enter or Space, which come after a key — is the only word there is.
  const fromPointer = useRef(false)

  // With no hour set there are no minutes to set either, so the face stays on the hour.
  const shown: DialUnit = value === null || hoursOnly ? 'hour' : unit
  const base = value ?? start
  const steps = DIAL_STEPS[shown]
  const { hour, minute } = timeParts(base)
  // What the hand rests on, and how far out: an hour on its own ring, a minute round the face.
  const chosen = shown === 'hour' ? hour : minute
  const radius = RING_RADIUS[shown === 'hour' ? ringOf(hour) : 'outer']
  // The number the Tab stop rests on. A minute between two of them — 7 past —
  // lends it to the nearer, so the face is always one stop and never none.
  const inReach = shown === 'hour' ? hour : (Math.round(minute / 5) * 5) % 60

  function set(picked: number) {
    if (hoursOnly) onChange(withMinute(withHour(base, picked), 0))
    else onChange(shown === 'hour' ? withHour(base, picked) : withMinute(base, picked))
  }

  // A key moved the hand: the focus follows it onto the number it came to rest by.
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    face.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [inReach, shown])

  /** Where a pointer is on the face, or null while the face has no size to measure — as in a test. */
  function pointUnder(event: PointerEvent, over: number): { step: number; ring: DialRing } | null {
    const box = face.current?.getBoundingClientRect()
    if (box === undefined || box.width === 0) return null
    const x = event.clientX - (box.left + box.width / 2)
    const y = event.clientY - (box.top + box.height / 2)
    return { step: stepAtPoint(x, y, over), ring: ringAtDistance(Math.hypot(x, y) / box.width) }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // A tap means the number under the finger, whichever face is up: the minutes
    // land on the five it is written at, not a minute either side of it.
    const at = pointUnder(event, DIAL_STEPS.hour)
    if (at === null) return
    fromPointer.current = true
    dragging.current = true
    face.current?.setPointerCapture(event.pointerId)
    set(shown === 'hour' ? hourAt(at.step, at.ring) : at.step * 5)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    // Dragging reads the face as finely as it is divided: every minute, not every
    // fifth, and for the hours the ring the finger is over as well as its angle.
    const at = pointUnder(event, steps)
    if (at !== null) set(shown === 'hour' ? hourAt(at.step, at.ring) : at.step)
  }

  function handlePointerUp() {
    if (!dragging.current) return
    dragging.current = false
    // The hour said, what is left is the minutes; letting go is what hands the
    // face over, and the focus with it, so the keys carry on where the hand left off.
    if (shown === 'hour' && !hoursOnly) {
      moved.current = true
      setUnit('minute')
    }
  }

  /** Enter or Space on a number, a pointer having its own way of saying the same. */
  function handleLabelClick(event: MouseEvent<HTMLButtonElement>, written: number) {
    if (fromPointer.current) return
    event.preventDefault()
    set(written)
    if (shown === 'hour' && !hoursOnly) {
      moved.current = true
      setUnit('minute')
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // A key is the keyboard's turn at the face, whatever the pointer did last.
    fromPointer.current = false

    // The keys go round the whole of what is being set — the day, or the hour —
    // so an hour on from 11 in the morning is noon, a ring in on the face.
    const to = moveByKey(event, chosen, shown === 'hour' ? DAY_HOURS : steps)
    if (to === null) return

    // The keys are the face's own: they are not scrolling the page behind it.
    event.preventDefault()
    event.stopPropagation()
    moved.current = true
    set(to)
  }

  /** Where a number sits on the face, in from its edge by the size of the number itself. */
  const place = (step: number, ring: DialRing) => {
    const { x, y } = stepOffset(step, steps)
    return {
      left: `${String(50 + x * RING_RADIUS[ring] * 100)}%`,
      top: `${String(50 + y * RING_RADIUS[ring] * 100)}%`,
    }
  }

  /** The numbers written on the face: both rings of hours, or the minutes round one. */
  const numbers: readonly { written: number; ring: DialRing }[] =
    shown === 'hour'
      ? [
          ...HOUR_LABELS.outer.map((written) => ({ written, ring: 'outer' as const })),
          ...HOUR_LABELS.inner.map((written) => ({ written, ring: 'inner' as const })),
        ]
      : MINUTE_LABELS.map((written) => ({ written, ring: 'outer' as const }))

  const hand = stepOffset(stepOf(chosen, shown), steps)
  const isSet = value !== null

  return (
    <div className="flex flex-col items-center gap-2 py-1 md:gap-1.5">
      {/* What the two halves make, for a reader that is following the face rather than reading it. */}
      <p aria-live="polite" className="sr-only">
        {isSet ? describeTimeOfDay(base) : 'No time set'}
      </p>

      <div className="flex items-baseline">
        <button
          type="button"
          onClick={() => { setUnit('hour') }}
          aria-pressed={shown === 'hour'}
          aria-label={isSet ? `Hour, ${String(hour)}` : 'Hour, not set'}
          title="Set the hour"
          className={`${readout} ${shown === 'hour' ? readoutOn : readoutOff}`}
        >
          {isSet ? String(hour).padStart(2, '0') : '--'}
        </button>
        <span aria-hidden="true" className="text-2xl font-semibold text-neutral-400 md:text-xl dark:text-neutral-500">
          :
        </span>
        {hoursOnly ? (
          // On the hour, always: there are no minutes to set.
          <span aria-hidden="true" className={`${readout} text-neutral-400 dark:text-neutral-500`}>
            00
          </span>
        ) : (
          <button
            type="button"
            onClick={() => { setUnit('minute') }}
            disabled={!isSet}
            aria-pressed={shown === 'minute'}
            aria-label={isSet ? `Minutes, ${String(minute)}` : 'Minutes, no hour set yet'}
            title={isSet ? 'Set the minutes' : 'Pick an hour first'}
            className={`${readout} ${shown === 'minute' ? readoutOn : readoutOff} disabled:pointer-events-none disabled:opacity-40`}
          >
            {isSet ? String(minute).padStart(2, '0') : '--'}
          </button>
        )}
      </div>

      <div
        ref={face}
        role="group"
        aria-label={shown === 'hour' ? 'Hour' : 'Minutes'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative size-56 shrink-0 touch-none rounded-full bg-neutral-100 select-none md:size-48 dark:bg-neutral-800"
      >
        {/* The hand, from the middle out to what is picked — as far as the ring it is on. Hidden
            until something is picked. */}
        {isSet && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 h-0.5 origin-left -translate-y-1/2 bg-blue-600 dark:bg-blue-500"
              style={{
                width: `${String(radius * 100)}%`,
                rotate: `${String((360 * stepOf(chosen, shown)) / steps - 90)}deg`,
              }}
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 dark:bg-blue-500"
            />
            {/* The minute the hand rests on, when no number is written there. */}
            {shown === 'minute' && minute % 5 !== 0 && (
              <span
                aria-hidden="true"
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 dark:bg-blue-500"
                style={{
                  left: `${String(50 + hand.x * radius * 100)}%`,
                  top: `${String(50 + hand.y * radius * 100)}%`,
                }}
              />
            )}
          </>
        )}

        {numbers.map(({ written, ring }) => {
          const on = isSet && written === chosen
          return (
            <button
              key={written}
              type="button"
              tabIndex={written === inReach ? 0 : -1}
              onClick={(event) => { handleLabelClick(event, written) }}
              aria-pressed={on}
              aria-label={shown === 'hour' ? undefined : `${String(written)} minutes`}
              style={place(stepOf(written, shown), ring)}
              className={`${label} ${ringLabel[ring]} ${on ? labelOn : labelOff}`}
            >
              {String(written).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
