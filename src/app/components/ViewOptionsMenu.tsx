import { DEFAULT_VIEW_OPTIONS, type ViewOptions } from '../../storage/viewOptionsRepository'
import { DetailsIcon } from './DetailsIcon'
import { OptionSwitch } from './OptionSwitch'
import { ViewMenu } from './ViewMenu'

interface ViewOptionsMenuProps {
  options: ViewOptions
  onChange: (options: ViewOptions) => void
}

/** Whether anything differs from how the views start. */
function isChanged(options: ViewOptions): boolean {
  return (Object.keys(DEFAULT_VIEW_OPTIONS) as (keyof ViewOptions)[]).some(
    (key) => options[key] !== DEFAULT_VIEW_OPTIONS[key],
  )
}

/**
 * The View button beside the add box, and the panel it opens of how the task
 * views are shown. The options hold for every view that lists tasks, and like
 * the pickers there is nothing to confirm: each change is shown as it is made,
 * and the panel stays open for the next.
 */
export function ViewOptionsMenu({ options, onChange }: ViewOptionsMenuProps) {
  return (
    <ViewMenu label="View" changed={isChanged(options)}>
      <OptionSwitch
        icon={<DetailsIcon />}
        label="Show task details"
        description="Date, reward, time goal, urgent and other details under every task"
        checked={options.showDetails}
        onChange={(showDetails) => { onChange({ ...options, showDetails }) }}
      />
    </ViewMenu>
  )
}
