import { DEFAULT_HABIT_VIEW_OPTIONS, type HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import { ChevronIcon } from './ChevronIcon'
import { OptionSwitch } from './OptionSwitch'
import { ViewMenu } from './ViewMenu'

interface HabitViewOptionsMenuProps {
  options: HabitViewOptions
  /** At the foot of the page, which is where a phone keeps it (UI-46). */
  atFoot?: boolean
  onChange: (options: HabitViewOptions) => void
}

/** Whether the habits view differs from how it starts. */
function isChanged(options: HabitViewOptions): boolean {
  return (Object.keys(DEFAULT_HABIT_VIEW_OPTIONS) as (keyof HabitViewOptions)[]).some(
    (key) => options[key] !== DEFAULT_HABIT_VIEW_OPTIONS[key],
  )
}

/**
 * The Habits page's View button and the panel that chooses how its cards start.
 * The change is immediate and kept on this device, like the task View options.
 * On a wide screen it stands beside the add box; on a phone, which has no box,
 * at the foot of the cards (UI-46).
 */
export function HabitViewOptionsMenu({ options, atFoot = false, onChange }: HabitViewOptionsMenuProps) {
  return (
    <ViewMenu label="View settings" changed={isChanged(options)} atFoot={atFoot}>
      <OptionSwitch
        icon={<ChevronIcon />}
        label="Show habit details by default"
        checked={options.showDetails}
        onChange={(showDetails) => { onChange({ ...options, showDetails }) }}
      />
    </ViewMenu>
  )
}
