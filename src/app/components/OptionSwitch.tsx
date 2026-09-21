import { useId, type ReactNode } from 'react'

interface OptionSwitchProps {
  icon: ReactNode
  label: string
  /** What turning it on does, in a line under the label. */
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * One option: the whole line is the switch, so it is one easy target, and it
 * says what it does under its name. On, its icon takes the tint a set control has.
 */
export function OptionSwitch({ icon, label, description, checked, onChange }: OptionSwitchProps) {
  // Named by its label alone; the line under it is its description, heard after.
  const labelledBy = useId()
  const describedBy = useId()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => { onChange(!checked) }}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800"
    >
      <span
        aria-hidden="true"
        className={
          checked
            ? 'grid size-8 shrink-0 place-items-center rounded-lg bg-blue-600/10 text-blue-600 transition-colors dark:bg-blue-400/10 dark:text-blue-300'
            : 'grid size-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors dark:bg-neutral-800 dark:text-neutral-400'
        }
      >
        {icon}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={labelledBy} className="text-sm leading-5 text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
        <span id={describedBy} className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">
          {description}
        </span>
      </span>

      {/* The track and its knob, drawn; the button is what is heard as the switch. */}
      <span
        aria-hidden="true"
        className={
          checked
            ? 'relative h-5 w-9 shrink-0 rounded-full bg-blue-600 transition-colors dark:bg-blue-500'
            : 'relative h-5 w-9 shrink-0 rounded-full bg-neutral-300 transition-colors dark:bg-neutral-700'
        }
      >
        <span
          className={
            checked
              ? 'absolute top-0.5 left-0.5 size-4 translate-x-4 rounded-full bg-white shadow-sm transition-transform'
              : 'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform'
          }
        />
      </span>
    </button>
  )
}
