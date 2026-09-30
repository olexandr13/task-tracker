import { useId } from 'react'
import { DEFAULT_NUDGE_WINDOW, QUIET_HOURS, type NudgeWindow, type QuietHours } from '../../core'
import type { NotifyPermission } from '../browserNotification'
import { describeNotifyPermission, describeNudgeSilence, describeQuietSpan } from '../nudgeLabels'
import { ClockIcon } from './ClockIcon'
import { OptionSwitch } from './OptionSwitch'
import { TimeOfDayPicker } from './TimeOfDayPicker'

/** A segment of the span control; its radio is the one it wears the focus ring for. */
const segment =
  'flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm text-neutral-500 transition-colors outline-offset-2 hover:text-neutral-900 has-checked:bg-white has-checked:font-medium has-checked:text-neutral-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-blue-500 md:min-h-8 dark:text-neutral-400 dark:hover:text-neutral-100 dark:has-checked:bg-neutral-700 dark:has-checked:text-neutral-100'

const note = 'text-xs text-neutral-500 dark:text-neutral-400'

interface NudgeSettingsProps {
  quietHours: QuietHours
  /** The hours it may speak in, or null for any hour (NUDGE-12). */
  window: NudgeWindow | null
  permission: NotifyPermission
  /** The moment the clock faces open against, where they have no hour to open on. */
  now: Date
  onQuietHoursChange: (hours: QuietHours) => void
  onWindowChange: (window: NudgeWindow | null) => void
}

/**
 * What there is to set about the nudge, on the mode's own page (MODE-12,
 * NUDGE-9): how long a quiet stretch it waits for, and the hours of the day it
 * may speak in.
 *
 * The span is one control of segments, each a real radio behind its label, so the
 * arrow keys move along them as in any radio group. The hours are two clock
 * faces, and under them the stretch nothing will be said in, written out — the
 * half of a window worth checking is the half it shuts out.
 */
export function NudgeSettings({
  quietHours,
  window,
  permission,
  now,
  onQuietHoursChange,
  onWindowChange,
}: NudgeSettingsProps) {
  const spanId = useId()
  const browser = describeNotifyPermission(permission)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p id={spanId} className={note}>
          After this long with nothing finished
        </p>
        <div
          role="radiogroup"
          aria-labelledby={spanId}
          className="mt-1.5 grid grid-cols-4 gap-1 rounded-lg bg-neutral-100 p-1 md:max-w-xs dark:bg-neutral-800"
        >
          {QUIET_HOURS.map((hours) => (
            <label key={hours} className={segment}>
              <input
                type="radio"
                name="nudge-span"
                value={hours}
                checked={quietHours === hours}
                onChange={() => { onQuietHoursChange(hours) }}
                className="sr-only"
              />
              {describeQuietSpan(hours)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="-mx-2">
          <OptionSwitch
            icon={<ClockIcon />}
            label="Only at certain hours"
            description="Outside them nothing is said at all, so the night stays quiet."
            checked={window !== null}
            onChange={(on) => { onWindowChange(on ? DEFAULT_NUDGE_WINDOW : null) }}
          />
        </div>

        {window !== null && (
          <>
            {/* Started at the top: an open face makes its own side of the row
                taller, and the other hour is not to drift down the middle of it. */}
            <div className="mt-1.5 flex items-start gap-2 md:max-w-xs">
              <TimeOfDayPicker
                label="From"
                value={window.from}
                now={now}
                onChange={(from) => { onWindowChange({ ...window, from }) }}
              />
              <TimeOfDayPicker
                label="To"
                value={window.to}
                now={now}
                align="right"
                onChange={(to) => { onWindowChange({ ...window, to }) }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">{describeNudgeSilence(window)}</p>
          </>
        )}
      </div>

      {browser !== null && <p className="text-xs text-amber-700 dark:text-amber-400">{browser}</p>}
    </div>
  )
}
