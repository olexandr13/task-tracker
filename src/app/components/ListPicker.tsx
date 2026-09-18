import { useEffect, useRef, useState } from 'react'
import { sortLists, type List, type ListId } from '../../core'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'
import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { FolderIcon } from './FolderIcon'

const hint = 'px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500'

interface ListPickerProps {
  /** The list the task is filed under, or null for the Inbox. */
  listId: ListId | null
  /** Every list there is, to choose from. */
  lists: readonly List[]
  onChange: (listId: ListId | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** Whether the button names the list beside its icon, or a way to file it when it is in none. */
  showName?: boolean
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * Where a task is filed, on a phone: a small button on the woken row that opens
 * a panel listing the Inbox and every list, the task's own marked. A wide screen
 * files a task from its menu instead (TaskItem), a phone having no right-click.
 *
 * The same shape as the pickers beside it, and like them there is nothing to
 * confirm. Unlike the tag picker it **closes on a choice**: a task is in one
 * list at a time, so choosing one is the whole of the job rather than the first
 * of several. The Inbox is first and always there — it is no list at all, so
 * there is always a way back out of a list.
 *
 * Making a list is not done from here: a list outlives the task that wanted it,
 * so it is made on the Lists page (ListsPage) rather than in passing.
 */
export function ListPicker({
  listId,
  lists,
  onChange,
  label = 'List',
  showName = false,
  align = 'right',
}: ListPickerProps) {
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

  const shown = sortLists(lists)
  // A task naming a list that has gone reads as being in the Inbox, here as
  // everywhere else, so the button never names a list that is not there.
  const filed = listId === null ? null : (shown.find((list) => list.id === listId) ?? null)
  const summary = filed?.name ?? 'Inbox'

  // Only as wide as it needs to be: a square around the icon when the value is
  // not spelled out beside it.
  const button = `${showName ? rowControlLabel : rowControlIcon} w-full`

  function choose(next: ListId | null) {
    onChange(next)
    setIsOpen(false)
  }

  return (
    <div
      ref={root}
      className="relative min-w-0 shrink"
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
        aria-label={`${label}: ${summary}`}
        title={filed === null ? 'File in a list' : summary}
        className={filed === null ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <FolderIcon />
        {showName && <span className="min-w-0 truncate">{filed === null ? 'File in a list' : summary}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-1.5 flex w-56 flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900`}
        >
          <div role="group" aria-label="Lists" className="flex max-h-60 flex-col overflow-y-auto">
            <Choice name="Inbox" chosen={filed === null} onSelect={() => { choose(null) }} />
            {shown.map((list) => (
              <Choice
                key={list.id}
                name={list.name}
                chosen={list.id === filed?.id}
                onSelect={() => { choose(list.id) }}
              />
            ))}
          </div>

          {shown.length === 0 && <p className={hint}>No lists yet. Make one on the Lists page.</p>}
        </div>
      )}
    </div>
  )
}

function Choice({ name, chosen, onSelect }: { name: string; chosen: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onSelect}
      className={chosen ? `${option} ${optionOn}` : `${option} ${optionOff}`}
    >
      <span aria-hidden="true" className="w-3 shrink-0">
        {chosen ? '✓' : ''}
      </span>
      <span className="min-w-0 truncate">{name}</span>
    </button>
  )
}
