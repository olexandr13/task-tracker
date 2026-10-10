import type { HoursWindow } from '../../core'
import type { NotifyPermission } from '../browserNotification'
import { describeCheckInPermission, describeCheckInSilence } from '../checkInLabels'
import { TimeOfDayPicker } from './TimeOfDayPicker'

const note = 'text-xs text-neutral-500 dark:text-neutral-400'

interface CheckInSettingsProps {
  /** The hours asked about, whole hours (CHECKIN-2). */
  window: HoursWindow
  permission: NotifyPermission
  /** The moment the clock faces open against. */
  now: Date
  onWindowChange: (window: HoursWindow) => void
}

/**
 * What there is to set about the check-in, on the mode's own page (MODE-12,
 * CHECKIN-2): the hours it asks about, From and To on the hour, picked off the
 * app's own clock face; under them the stretch it says nothing about, written
 * out — the half of the hours worth checking is the half they shut out — and
 * what this browser allows.
 */
export function CheckInSettings({ window, permission, now, onWindowChange }: CheckInSettingsProps) {
  const browser = describeCheckInPermission(permission)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={note}>Asks about the hours from</p>
        {/* Started at the top: an open face makes its own side of the row taller. */}
        <div className="mt-1.5 flex items-start gap-2 md:max-w-xs">
          <TimeOfDayPicker
            label="From"
            value={window.from}
            now={now}
            hoursOnly
            onChange={(from) => { onWindowChange({ ...window, from }) }}
          />
          <TimeOfDayPicker
            label="To"
            value={window.to}
            now={now}
            align="right"
            hoursOnly
            onChange={(to) => { onWindowChange({ ...window, to }) }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">{describeCheckInSilence(window)}</p>
      </div>

      {browser !== null && <p className="text-xs text-amber-700 dark:text-amber-400">{browser}</p>}
    </div>
  )
}
