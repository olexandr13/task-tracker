import { useState, type KeyboardEvent } from 'react'
import { isListName, MAX_LIST_NAME_LENGTH, type ListId, type ListSummary } from '../../core'
import { deleteControl } from '../rowControls'
import { FolderIcon } from './FolderIcon'
import { InboxIcon } from './InboxIcon'
import { PencilIcon } from './PencilIcon'

const row =
  'flex items-center rounded-xl border border-neutral-200 bg-white pr-1.5 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
const open = 'flex min-w-0 flex-1 items-center gap-2.5 rounded-l-xl px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-100'
const glyph = 'size-4 shrink-0 text-neutral-400 dark:text-neutral-500'
const count = 'shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500'
const smallControl =
  'flex size-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
const field =
  'min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'

interface ListsPageProps {
  /** Every list, in the order they are shown, as `summarizeLists` gives them. */
  lists: readonly ListSummary[]
  /** How many tasks in the Inbox are still to do. */
  inboxOpen: number
  onOpenInbox: () => void
  onOpen: (id: ListId) => void
  /** Makes a list and opens it. False when the name will not do — one another list has. */
  onAdd: (name: string) => boolean
  /** Renames a list. False when another list is called that already. */
  onRename: (id: ListId, name: string) => boolean
  /** Deletes the list; its tasks go back to the Inbox. */
  onDelete: (id: ListId) => void
}

/**
 * The Lists page: the Inbox, then every list, each opening the tasks filed under
 * it. Beside each, how many of those are still to do — nothing once they are all
 * done, the list being no less a list for it — and buttons to rename and delete.
 *
 * A box on top makes a list. A list is a record of its own, so it is made here
 * on purpose rather than in passing on a task, and an empty one stays:
 * somewhere to put the next thing is the point of it.
 *
 * The Inbox heads the page and has no buttons of its own. It is not a record —
 * it is what "in no list" looks like — so there is nothing to rename or delete,
 * and it is always there to move a task back to.
 */
export function ListsPage({
  lists,
  inboxOpen,
  onOpenInbox,
  onOpen,
  onAdd,
  onRename,
  onDelete,
}: ListsPageProps) {
  const [typed, setTyped] = useState('')
  // The list being renamed, and what has been typed over its name so far.
  const [editing, setEditing] = useState<{ id: ListId; name: string } | null>(null)
  // What went wrong with the last name tried, under the box or the row it was typed in.
  const [taken, setTaken] = useState<ListId | 'new' | null>(null)

  function handleAdd() {
    if (!isListName(typed)) return

    if (onAdd(typed)) {
      setTyped('')
      setTaken(null)
    } else {
      setTaken('new')
    }
  }

  function startRename(id: ListId, name: string) {
    setEditing({ id, name })
    setTaken(null)
  }

  function commitRename() {
    if (editing === null) return

    // A name that will not do leaves the box open with it still in, to fix or give up on.
    if (!isListName(editing.name)) return
    if (onRename(editing.id, editing.name)) {
      setEditing(null)
      setTaken(null)
    } else {
      setTaken(editing.id)
    }
  }

  function handleRenameKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    } else if (event.key === 'Escape') {
      // Giving up leaves the list named as it was, as dropping a title edit does.
      event.preventDefault()
      setEditing(null)
      setTaken(null)
    }
  }

  function handleDelete(id: ListId, name: string) {
    // The list goes for good, with nothing to undo it from, so it asks first.
    if (window.confirm(`Delete the list "${name}"? Its tasks go back to the Inbox; the tasks stay.`)) {
      onDelete(id)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value)
              if (taken === 'new') setTaken(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            maxLength={MAX_LIST_NAME_LENGTH}
            placeholder="Add a list"
            aria-label="Name of the new list"
            autoComplete="off"
            enterKeyHint="done"
            className={field}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isListName(typed)}
            className="shrink-0 self-stretch rounded-lg px-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 active:bg-neutral-100 md:self-auto md:px-2.5 md:py-1 md:text-sm dark:active:bg-neutral-800 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            Add
          </button>
        </div>
        {taken === 'new' && (
          <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
            There is a list called that already.
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        <li className={row}>
          <button
            type="button"
            onClick={onOpenInbox}
            aria-label={inboxOpen === 0 ? 'Inbox' : `Inbox: ${String(inboxOpen)} to do`}
            className={open}
          >
            <InboxIcon className={glyph} />
            <span className="min-w-0 flex-1 truncate">Inbox</span>
            {inboxOpen > 0 && (
              <span aria-hidden="true" className={count}>
                {inboxOpen}
              </span>
            )}
          </button>
        </li>

        {lists.map(({ list, open: todo }) => (
          <li key={list.id} className="flex flex-col gap-1">
            <div className={row}>
              {editing?.id === list.id ? (
                <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1">
                  <FolderIcon className={glyph} />
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(event) => {
                      setEditing({ id: list.id, name: event.target.value })
                      if (taken === list.id) setTaken(null)
                    }}
                    onKeyDown={handleRenameKeys}
                    onBlur={commitRename}
                    maxLength={MAX_LIST_NAME_LENGTH}
                    // Asking to rename is asking to type: the caret goes there, over the old name.
                    autoFocus
                    aria-label={`Name of the list "${list.name}"`}
                    autoComplete="off"
                    enterKeyHint="done"
                    className={field}
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { onOpen(list.id) }}
                    aria-label={todo === 0 ? list.name : `${list.name}: ${String(todo)} to do`}
                    className={open}
                  >
                    <FolderIcon className={glyph} />
                    <span className="min-w-0 flex-1 truncate">{list.name}</span>
                    {todo > 0 && (
                      <span aria-hidden="true" className={count}>
                        {todo}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { startRename(list.id, list.name) }}
                    aria-label={`Rename the list "${list.name}"`}
                    title="Rename list"
                    className={smallControl}
                  >
                    <PencilIcon className="size-3.5 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleDelete(list.id, list.name) }}
                    aria-label={`Delete the list "${list.name}"`}
                    title="Delete list"
                    className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
                  >
                    ×
                  </button>
                </>
              )}
            </div>

            {taken === list.id && (
              <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
                There is a list called that already.
              </p>
            )}
          </li>
        ))}
      </ul>

      {lists.length === 0 && (
        <p className="py-6 text-center text-neutral-400 dark:text-neutral-600">
          No lists yet. Name one above — Work, Home — and file your tasks under it.
        </p>
      )}
    </div>
  )
}
