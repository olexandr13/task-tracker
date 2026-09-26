import { controlOff, controlOn, rowControlIcon } from '../rowControls'
import { FlagIcon } from './FlagIcon'

interface UrgentToggleProps {
  urgent: boolean
  onChange: (urgent: boolean) => void
  /** What this toggle is for, when there is more than one on screen. */
  label?: string
}

/**
 * Marks a task urgent, or clears the mark. A pressed flag is on; clicking it
 * flips the mark with nothing to confirm.
 *
 * Lives on a woken wide-screen row and in a sheet's row of icons (UI-63), not on
 * the resting row: urgent is set from details (or the task's menu), not from a
 * control slot on every task (TASK-62, TASK-63).
 */
export function UrgentToggle({
  urgent,
  onChange,
  label = 'Urgent',
}: UrgentToggleProps) {
  return (
    <button
      type="button"
      onClick={() => { onChange(!urgent) }}
      aria-pressed={urgent}
      aria-label={label}
      title={urgent ? 'Urgent' : 'Mark as urgent'}
      className={urgent ? `${rowControlIcon} ${controlOn}` : `${rowControlIcon} ${controlOff}`}
    >
      <FlagIcon />
    </button>
  )
}
