import { useRef, useState, type ReactNode } from 'react'
import { sortLists, type List, type ListId } from '../../core'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'
import { controlOff, controlOn, rowControlIcon } from '../rowControls'
import { FolderIcon } from './FolderIcon'
import { InboxIcon } from './InboxIcon'
import { PickerPanel } from './PickerPanel'

const hint = 'px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500'

interface ListPickerProps {
  /** The list the task is filed under, or null for the Inbox. */
  listId: ListId | null
  /** Every list there is, to choose from. */
  lists: readonly List[]
  onChange: (listId: ListId | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * Where a task is filed: a small button that opens a panel listing the Inbox
 * and every list, the task's own marked. On a wide screen it sits on the woken
 * row (and the task's menu still files the same way); on a phone it is on the
 * sheet, a phone having no right-click.
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
  align = 'right',
}: ListPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const shown = sortLists(lists)
  // A task naming a list that has gone reads as being in the Inbox, here as
  // everywhere else, so the button never names a list that is not there.
  const filed = listId === null ? null : (shown.find((list) => list.id === listId) ?? null)
  const summary = filed?.name ?? 'Inbox'

  const button = `${rowControlIcon} w-full`

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
        title={filed === null ? 'Select list' : summary}
        className={filed === null ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <FolderIcon />
      </button>

      {isOpen && (
        <PickerPanel
          anchor={root}
          label={label}
          align={align}
          width="w-64 md:w-56"
          content="gap-0.5 p-1.5 md:p-1"
          onClose={() => { setIsOpen(false) }}
        >
          <div role="group" aria-label="Lists" className="flex max-h-60 flex-col overflow-y-auto">
            <Choice
              name="Inbox"
              icon={<InboxIcon />}
              chosen={filed === null}
              onSelect={() => { choose(null) }}
            />
            {shown.map((list) => (
              <Choice
                key={list.id}
                name={list.name}
                icon={<FolderIcon />}
                chosen={list.id === filed?.id}
                onSelect={() => { choose(list.id) }}
              />
            ))}
          </div>

          {shown.length === 0 && <p className={hint}>No lists yet. Make one on the Lists page.</p>}
        </PickerPanel>
      )}
    </div>
  )
}

function Choice({
  name,
  icon,
  chosen,
  onSelect,
}: {
  name: string
  icon: ReactNode
  chosen: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onSelect}
      className={chosen ? `${option} ${optionOn}` : `${option} ${optionOff}`}
    >
      <span aria-hidden="true" className="w-5 shrink-0 md:w-3">
        {chosen ? '✓' : ''}
      </span>
      <span
        aria-hidden="true"
        className="grid shrink-0 place-items-center text-neutral-400 [&>svg]:size-5 md:[&>svg]:size-4 dark:text-neutral-500"
      >
        {icon}
      </span>
      <span className="min-w-0 truncate">{name}</span>
    </button>
  )
}
