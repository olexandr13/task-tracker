import { useId } from 'react'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import { ChevronIcon } from './ChevronIcon'
import { OptionSwitch } from './OptionSwitch'

interface HabitsCardProps {
  options: HabitViewOptions
  onChange: (options: HabitViewOptions) => void
}

/**
 * The habits on Settings (HAB-23): how the Habits page's cards start. The
 * change is kept on this device, as the theme is, and Habits is drawn to it
 * when next opened.
 */
export function HabitsCard({ options, onChange }: HabitsCardProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id={headingId} className="text-sm font-medium">
        Habits
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        How the Habits page shows its cards. Kept on this device only.
      </p>

      <div className="mt-2 -mx-2">
        <OptionSwitch
          icon={<ChevronIcon />}
          label="Show habit details by default"
          checked={options.showDetails}
          onChange={(showDetails) => { onChange({ ...options, showDetails }) }}
        />
      </div>
    </section>
  )
}
