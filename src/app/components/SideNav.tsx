import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { VIEW_LABELS, type View } from '../view'
import { CalendarIcon } from './CalendarIcon'
import { ListIcon } from './ListIcon'
import { TrashIcon } from './TrashIcon'

const VIEWS: readonly {
  readonly value: View
  readonly label: string
  readonly Icon: (props: { className?: string }) => ReactElement
}[] = [
  { value: 'today', label: VIEW_LABELS.today, Icon: CalendarIcon },
  { value: 'tasks', label: VIEW_LABELS.tasks, Icon: ListIcon },
  { value: 'trash', label: VIEW_LABELS.trash, Icon: TrashIcon },
]

const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors'
const itemOn = 'bg-neutral-200/70 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const itemOff =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'

interface SideNavProps {
  view: View
  onChange: (view: View) => void
}

/**
 * Which screen you are on. A plain list down the left where there is room for
 * one, and below that width the same list collapsed to the view you are on,
 * which expands in place — a sidebar is a poor use of a phone.
 */
export function SideNav({ view, onChange }: SideNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  // Falling back to the first entry keeps the collapsed button readable even if
  // it is ever asked for a view that is no longer listed.
  const current = VIEWS.find((entry) => entry.value === view) ?? VIEWS[0]

  function choose(next: View) {
    onChange(next)
    setIsOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      setIsOpen(false)
    }
  }

  return (
    <nav ref={root} aria-label="Views" className="relative md:w-44 md:shrink-0" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen) }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2.5 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 transition-colors hover:bg-neutral-50 md:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <current.Icon />
        <span className="flex-1 text-left font-medium">{current.label}</span>
        <span aria-hidden="true" className="text-xs leading-none">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen && (
        <ul
          className="absolute inset-x-0 z-20 mt-2 flex flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl md:hidden dark:border-neutral-700 dark:bg-neutral-900"
        >
          {VIEWS.map((entry) => (
            <NavItem key={entry.value} entry={entry} active={entry.value === view} onSelect={choose} />
          ))}
        </ul>
      )}

      <ul className="hidden flex-col gap-0.5 md:flex">
        {VIEWS.map((entry) => (
          <NavItem key={entry.value} entry={entry} active={entry.value === view} onSelect={choose} />
        ))}
      </ul>
    </nav>
  )
}

function NavItem({
  entry,
  active,
  onSelect,
}: {
  entry: (typeof VIEWS)[number]
  active: boolean
  onSelect: (view: View) => void
}) {
  const { value, label, Icon } = entry

  return (
    <li>
      <button
        type="button"
        onClick={() => { onSelect(value) }}
        aria-current={active ? 'page' : undefined}
        className={active ? `${item} ${itemOn}` : `${item} ${itemOff}`}
      >
        <Icon />
        {label}
      </button>
    </li>
  )
}
