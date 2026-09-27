import { useEffect, useRef, useState, type ReactNode } from 'react'
import { footLink, footLinkOpen } from '../footControls'
import { panelHeading } from '../panelControls'
import { SlidersIcon } from './SlidersIcon'

/**
 * Beside the add box, as tall as it so the two read as one line, and padded to as
 * wide: a square. Padding rather than an aspect ratio, which the space the button
 * is given is worked out before, and so would not make room for.
 */
const button =
  'grid size-9 place-items-center rounded-lg border outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 md:size-auto md:px-3.5'

/** At rest, dressed as the add box is. */
const buttonClosed =
  'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60'

/** Open, it stays lit, so it is plain what the panel below belongs to. */
const buttonOpen = 'border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800'

/** As the views start. */
const iconOff = 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100'

/** Set otherwise, tinted as a row's set controls are. */
const iconOn = 'text-blue-600/80 hover:text-blue-600 dark:text-blue-300/70 dark:hover:text-blue-300'

/** At the foot the words carry the meaning, so only the sliders take the tint. */
const footIconOn = 'text-blue-600 dark:text-blue-300'

interface ViewMenuProps {
  label: string
  changed: boolean
  /**
   * At the foot of the page rather than beside the add box (UI-46), where a phone
   * has no box for it to stand beside: a line naming itself in words, like the
   * other ways on kept there, with its panel opening upwards clear of the bar.
   */
  atFoot?: boolean
  children: ReactNode
}

/** A View button and the panel that opens from it. */
export function ViewMenu({ label, changed, atFoot = false, children }: ViewMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

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
      className={`relative flex ${atFoot ? 'self-start' : 'shrink-0'}`}
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
        // The foot's button says its name on the line; beside the box it is the sliders alone.
        aria-label={atFoot ? undefined : label}
        title={atFoot ? undefined : label}
        className={
          atFoot
            ? `${footLink} ${isOpen ? footLinkOpen : ''}`
            : `${button} ${isOpen ? buttonOpen : buttonClosed} ${changed ? iconOn : iconOff}`
        }
      >
        <SlidersIcon className={`size-4 shrink-0 ${atFoot && changed ? footIconOn : ''}`} />
        {atFoot && label}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute z-30 flex w-72 flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 ${
            atFoot ? 'bottom-full left-0 mb-1.5' : 'top-full right-0 mt-1.5'
          }`}
        >
          {/* The panel's name is its label already; this is the same word for the eye. */}
          <p aria-hidden="true" className={`${panelHeading} pb-1`}>
            {label}
          </p>
          {children}
        </div>
      )}
    </div>
  )
}
