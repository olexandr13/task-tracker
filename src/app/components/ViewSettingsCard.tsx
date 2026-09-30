import { useId } from 'react'
import type { HabitViewOptions } from '../../storage/habitViewOptionsRepository'
import { OptionSwitch } from './OptionSwitch'

interface ViewSettingsCardProps {
  habitView: HabitViewOptions
  onHabitViewChange: (options: HabitViewOptions) => void
}

/**
 * The view settings on Settings (UI-35): how the pages start out, one switch a
 * line, each naming the page it speaks for. The choices are kept on this
 * device, as the theme is, and a page is drawn to them when next opened.
 */
export function ViewSettingsCard({ habitView, onHabitViewChange }: ViewSettingsCardProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id={headingId} className="text-sm font-medium">
        View settings
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        How the pages start out. Kept on this device only.
      </p>

      <div className="mt-2 -mx-2">
        <OptionSwitch
          label="Show habit details by default"
          checked={habitView.showDetails}
          onChange={(showDetails) => { onHabitViewChange({ ...habitView, showDetails }) }}
        />
      </div>
    </section>
  )
}
