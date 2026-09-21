import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { FlagIcon } from './FlagIcon'

interface UrgentToggleProps {
  urgent: boolean
  onChange: (urgent: boolean) => void
  /** What this toggle is for, when there is more than one on screen. */
  label?: string
  /** Whether the button names Urgent beside its flag. */
  showName?: boolean
}

/**
 * Marks a task urgent, or clears the mark. A pressed flag is on; clicking it
 * flips the mark with nothing to confirm.
 *
 * Lives on a woken wide-screen row and a phone's sheet, not on the resting row:
 * urgent is set from details (or the task's menu), not from a control slot on
 * every task (TASK-62, TASK-63).
 */
export function UrgentToggle({
  urgent,
  onChange,
  label = 'Urgent',
  showName = false,
}: UrgentToggleProps) {
  // Named (sheet) fills its row so the whole line is the hit target (UI-59);
  // icon-only stays content-sized for a woken strip.
  const button = showName ? `${rowControlLabel} w-full` : rowControlIcon

  return (
    <button
      type="button"
      onClick={() => { onChange(!urgent) }}
      aria-pressed={urgent}
      aria-label={label}
      title={urgent ? 'Urgent' : 'Mark as urgent'}
      className={urgent ? `${button} ${controlOn}` : `${button} ${controlOff}`}
    >
      <FlagIcon />
      {showName && <span className="min-w-0 truncate">{urgent ? 'Urgent' : 'Mark urgent'}</span>}
    </button>
  )
}
