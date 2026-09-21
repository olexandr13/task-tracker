import { DEFAULT_HABIT_VIEW_OPTIONS, type HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import { ChevronIcon } from './ChevronIcon'
import { OptionSwitch } from './OptionSwitch'
import { ViewMenu } from './ViewMenu'

interface HabitViewOptionsMenuProps {
  options: HabitViewOptions
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
 */
export function HabitViewOptionsMenu({ options, onChange }: HabitViewOptionsMenuProps) {
  return (
    <ViewMenu label="View settings" changed={isChanged(options)}>
      <OptionSwitch
        icon={<ChevronIcon />}
        label="Show habit details by default"
        description="Start each habit open, with its numbers and days in view"
        checked={options.showDetails}
        onChange={(showDetails) => { onChange({ ...options, showDetails }) }}
      />
    </ViewMenu>
  )
}
