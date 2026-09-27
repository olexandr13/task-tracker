import { useState, type KeyboardEvent } from 'react'
import { isTagName, type TagSummary } from '../../core'
import { deleteControl } from '../rowControls'
import { PencilIcon } from './PencilIcon'
import { TagIcon } from './TagIcon'

const field =
  'min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const warning = 'px-1 text-xs text-red-600 dark:text-red-400'
const row =
  'flex items-center rounded-xl border border-neutral-200 bg-white pr-1.5 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
const glyph = 'size-4 shrink-0 text-neutral-400 dark:text-neutral-500'
const smallControl =
  'flex size-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/** A tag is typed with its `#` as often as without. */
function bare(typed: string): string {
  return typed.trim().replace(/^#+/u, '')
}

interface TagListProps {
  /** Every tag there is, alphabetically, as `summarizeTags` gives them. */
  tags: readonly TagSummary[]
  onOpen: (name: string) => void
  /** Makes a tag no task carries yet. False when there is a tag of that name already. */
  onAdd: (name: string) => boolean
  /** Renames a tag on every task carrying it. False when another tag is called that already. */
  onRename: (from: string, to: string) => boolean
  /** Takes the tag off every task carrying it, and stops keeping it. */
  onDelete: (name: string) => void
}

/**
 * The Tags page: every tag there is, each opening the list of the tasks carrying
 * it. Beside each, how many of those are still to do — nothing once they all
 * are done, or when none carries it, the tag being no less a tag for it — and
 * buttons renaming the tag in place and deleting it, as the Lists page has.
 *
 * A box on top makes a tag before any task has it, and stays on the page, so
 * several can be made in a row.
 */
export function TagList({ tags, onOpen, onAdd, onRename, onDelete }: TagListProps) {
  const [typed, setTyped] = useState('')
  // The tag being renamed, and what has been typed over its name so far.
  const [editing, setEditing] = useState<{ tag: string; name: string } | null>(null)
  // Which box was last refused a name some tag has already: the new one's, or a row's.
  const [taken, setTaken] = useState<string | null>(null)

  const name = bare(typed)
  const canAdd = isTagName(name)

  function handleAdd() {
    if (!canAdd) return

    if (onAdd(name)) {
      setTyped('')
      setTaken(null)
    } else {
      setTaken('')
    }
  }

  function startRename(tag: string) {
    setEditing({ tag, name: tag })
    setTaken(null)
  }

  function commitRename() {
    if (editing === null) return

    const renamed = bare(editing.name)
    // A name that will not do leaves the box open with it still in, to fix or give up on.
    if (!isTagName(renamed)) return
    // The same name again, or the same name in another case, is not a rename to refuse.
    if (renamed === editing.tag || onRename(editing.tag, renamed)) {
      setEditing(null)
      setTaken(null)
    } else {
      setTaken(editing.tag)
    }
  }

  function handleRenameKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    } else if (event.key === 'Escape') {
      // Giving up leaves the tag named as it was, as dropping a title edit does.
      event.preventDefault()
      setEditing(null)
      setTaken(null)
    }
  }

  function handleDelete(tag: string) {
    // It comes off every task at once, with nothing to undo it from, so it asks first.
    if (window.confirm(`Delete the tag "${tag}"? It comes off every task that carries it; the tasks stay.`)) {
      onDelete(tag)
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
              if (taken === '') setTaken(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Add a tag"
            aria-label="Name of the new tag"
            autoComplete="off"
            enterKeyHint="done"
            className={field}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="shrink-0 self-stretch rounded-lg px-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 active:bg-neutral-100 md:self-auto md:px-2.5 md:py-1 md:text-sm dark:active:bg-neutral-800 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            Add
          </button>
        </div>
        {taken === '' && (
          <p role="alert" className={warning}>
            There is a tag called that already.
          </p>
        )}
        {name !== '' && !canAdd && (
          <p role="alert" className={warning}>
            A tag is one word, without \ / " # : * ? &lt; &gt; | or commas.
          </p>
        )}
      </div>

      {tags.length === 0 ? (
        <p className="py-6 text-center text-neutral-400 dark:text-neutral-600">
          No tags yet. Name one above, tag a task from its menu — right-click it, or open its sheet on a phone — or type #
          in its description.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tags.map(({ name: tag, open }) => (
            <li key={tag} className="flex flex-col gap-1">
              <div className={row}>
                {editing?.tag === tag ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1">
                    <TagIcon className={glyph} />
                    <input
                      type="text"
                      value={editing.name}
                      onChange={(event) => {
                        setEditing({ tag, name: event.target.value })
                        if (taken === tag) setTaken(null)
                      }}
                      onKeyDown={handleRenameKeys}
                      onBlur={commitRename}
                      // Asking to rename is asking to type: the caret goes there, over the old name.
                      autoFocus
                      aria-label={`Name of the tag "${tag}"`}
                      autoComplete="off"
                      enterKeyHint="done"
                      className={field}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { onOpen(tag) }}
                      aria-label={open === 0 ? tag : `${tag}: ${String(open)} to do`}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-l-xl px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-100"
                    >
                      <TagIcon className={glyph} />
                      <span className="min-w-0 flex-1 truncate">{tag}</span>
                      {open > 0 && (
                        <span aria-hidden="true" className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                          {open}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { startRename(tag) }}
                      aria-label={`Rename the tag "${tag}"`}
                      title="Rename tag"
                      className={smallControl}
                    >
                      <PencilIcon className="size-3.5 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleDelete(tag) }}
                      aria-label={`Delete the tag "${tag}"`}
                      title="Delete tag"
                      className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
                    >
                      ×
                    </button>
                  </>
                )}
              </div>

              {editing?.tag === tag && taken === tag && (
                <p role="alert" className={warning}>
                  There is a tag called that already.
                </p>
              )}
              {editing?.tag === tag && bare(editing.name) !== '' && !isTagName(bare(editing.name)) && (
                <p role="alert" className={warning}>
                  A tag is one word, without \ / " # : * ? &lt; &gt; | or commas.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
