import { useId } from 'react'
import { QUIET_HOURS, type QuietHours } from '../../core'
import type { NotifyPermission } from '../browserNotification'
import { BellIcon } from './BellIcon'
import { OptionSwitch } from './OptionSwitch'

/** A segment of the span control; its radio is the one it wears the focus ring for. */
const segment =
  'flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm text-neutral-500 transition-colors outline-offset-2 hover:text-neutral-900 has-checked:bg-white has-checked:font-medium has-checked:text-neutral-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-blue-500 md:min-h-8 dark:text-neutral-400 dark:hover:text-neutral-100 dark:has-checked:bg-neutral-700 dark:has-checked:text-neutral-100'

interface NudgeCardProps {
  on: boolean
  quietHours: QuietHours
  permission: NotifyPermission
  onTurnOn: (on: boolean) => void
  onQuietHoursChange: (hours: QuietHours) => void
}

/** What the card has to add about the browser, if anything. */
function permissionNote(permission: NotifyPermission): string | null {
  switch (permission) {
    case 'denied':
      return 'This browser is blocking notifications, so the nudge will only show on screen. Allow them in the site’s settings to have it reach you elsewhere.'
    case 'unavailable':
      return 'This browser has no notifications, so the nudge will only show on screen.'
    case 'default':
      return 'Allow notifications when the browser asks, or the nudge will only show on screen.'
    case 'granted':
      return null
  }
}

/**
 * The nudge, on Settings (NUDGE-9): whether the app says something when the
 * work goes quiet, and how long a quiet stretch it waits for. The span is one
 * control of segments, each a real radio behind its label, so the arrow keys
 * move along them as in any radio group.
 */
export function NudgeCard({ on, quietHours, permission, onTurnOn, onQuietHoursChange }: NudgeCardProps) {
  const name = useId()
  const headingId = useId()
  const spanId = useId()
  const note = on ? permissionNote(permission) : null

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id={headingId} className="text-sm font-medium">
        Nudge
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        Reaches you while the app is open, here or installed — nothing arrives once it is closed.
        Kept on this device only.
      </p>

      <div className="mt-2 -mx-2">
        <OptionSwitch
          icon={<BellIcon />}
          label="Nudge me when nothing gets done"
          description="Names the task to pick up next, and points at it."
          checked={on}
          onChange={onTurnOn}
        />
      </div>

      {on && (
        <>
          <p id={spanId} className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
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
                  name={name}
                  value={hours}
                  checked={quietHours === hours}
                  onChange={() => { onQuietHoursChange(hours) }}
                  className="sr-only"
                />
                {hours}h
              </label>
            ))}
          </div>
        </>
      )}

      {note !== null && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">{note}</p>
      )}
    </section>
  )
}
