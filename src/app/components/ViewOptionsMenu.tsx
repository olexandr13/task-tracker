import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_VIEW_OPTIONS, type ViewOptions } from '../../storage/viewOptionsRepository'
import { panelHeading } from '../panelControls'
import { DetailsIcon } from './DetailsIcon'
import { SlidersIcon } from './SlidersIcon'

interface ViewOptionsMenuProps {
  options: ViewOptions
  onChange: (options: ViewOptions) => void
}

/**
 * As tall as the add box beside it, so the two read as one line, and padded to
 * as wide: a square. Padding rather than an aspect ratio, which the space the
 * button is given is worked out before, and so would not make room for.
 */
const button =
  'grid place-items-center rounded-lg border px-3.5 outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500'

/** At rest, dressed as the add box is. */
const buttonClosed =
  'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60'

/** Open, it stays lit, so it is plain what the panel below belongs to. */
const buttonOpen = 'border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800'

/** As the views start. */
const iconOff = 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100'

/** Set otherwise, tinted as a row's set controls are. */
const iconOn = 'text-blue-600/80 hover:text-blue-600 dark:text-blue-300/70 dark:hover:text-blue-300'

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
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const changed = isChanged(options)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  return (
    <div
      ref={root}
      className="relative flex shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen) }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="View"
        title="View"
        className={`${button} ${isOpen ? buttonOpen : buttonClosed} ${changed ? iconOn : iconOff}`}
      >
        <SlidersIcon />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="View"
          className="absolute top-full right-0 z-10 mt-1.5 flex w-72 flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          {/* The panel's name is its label already; this is the same word for the eye. */}
          <p aria-hidden="true" className={`${panelHeading} pb-1`}>
            View
          </p>
          <OptionSwitch
            icon={<DetailsIcon />}
            label="Show task details"
            description="Date, reward, time goal and other details under every task"
            checked={options.showDetails}
            onChange={(showDetails) => { onChange({ ...options, showDetails }) }}
          />
        </div>
      )}
    </div>
  )
}

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
function OptionSwitch({ icon, label, description, checked, onChange }: OptionSwitchProps) {
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
