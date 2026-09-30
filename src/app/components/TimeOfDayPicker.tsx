import { useRef, useState } from 'react'
import type { LocalTime } from '../../core'
import { describeTimeOfDay } from '../dueLabels'
import { ClockDial } from './ClockDial'
import { PickerPanel } from './PickerPanel'

/** The hour as it stands, and what opens the face to change it. A whole line is the target. */
const box =
  'flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-neutral-300 px-3 text-left transition-colors hover:border-neutral-400 md:min-h-9 md:rounded-lg dark:border-neutral-700 dark:hover:border-neutral-500'

interface TimeOfDayPickerProps {
  /** What the hour is for — `From`, `To` — read beside it and naming its panel. */
  label: string
  value: LocalTime
  /** The moment the face opens against, where it has no hour to open on. */
  now: Date
  /** Which edge the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
  onChange: (time: LocalTime) => void
}

/**
 * An hour of the day on a page: what it is set to, and the app's own clock face
 * to change it on (DUE-24) rather than the browser's `time` box, which is the
 * browser's design and not the app's.
 *
 * There is nothing to confirm, as in the other pickers: the hour is set as it is
 * picked. The face stays open while the minutes are still to say, and closes on
 * a click outside it or Escape — the panel hears the click itself, and Escape is
 * this control's to hear, as it is the time picker's.
 */
export function TimeOfDayPicker({ label, value, now, align = 'left', onChange }: TimeOfDayPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={root}
      className="relative min-w-0 flex-1"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          // The face's own key, not one for whatever the page has open behind it.
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
        title={`Pick the hour to ${label.toLowerCase()}`}
        className={box}
      >
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className="text-sm font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
          {describeTimeOfDay(value)}
        </span>
      </button>

      {isOpen && (
        <>
          <PickerPanel
            anchor={root}
            label={label}
            align={align}
            width="w-[min(20rem,calc(100vw-2rem))] md:w-60"
            content="gap-2 rounded-2xl p-3 md:gap-1.5 md:rounded-xl md:p-2"
            onClose={() => { setIsOpen(false) }}
          >
            <ClockDial value={value} now={now} onChange={onChange} />
          </PickerPanel>

          {/* The panel hangs over the page rather than in it, so where the page
              ends a line under the button there is nothing to scroll down to and
              the foot of the face cannot be reached. This is that room, kept to
              a phone: a wide screen has the height already. */}
          <div aria-hidden="true" className="h-80 md:hidden" />
        </>
      )}
    </div>
  )
}
