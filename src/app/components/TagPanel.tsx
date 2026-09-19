import { useState, type KeyboardEvent } from 'react'
import { distinctTags, isTagName, matchTags, sameTag } from '../../core'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'

const hint = 'px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500'

interface TagPanelProps {
  /** The tags the task carries. */
  tags: readonly string[]
  /** Every tag in use, to choose from. */
  known: readonly string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  /** Whether the box takes the caret as the panel opens; otherwise that is left to what holds the panel. */
  autoFocus?: boolean
}

/**
 * What a task's tag panel holds, wherever it opens: a box to find or make a tag,
 * over every tag there is, the task's own ticked.
 *
 * There is nothing to confirm: a tag goes on or comes off as it is clicked, and
 * Enter in the box puts on the tag it names, making it first if there is none.
 * Nothing here closes the panel, since a task often takes more than one.
 */
export function TagPanel({ tags, known, onAdd, onRemove, autoFocus = false }: TagPanelProps) {
  const [query, setQuery] = useState('')

  // A tag is typed with its `#` as often as without.
  const typed = query.trim().replace(/^#+/u, '')
  const all = distinctTags([...known, ...tags])
  const shown = matchTags(all, typed)
  const existing = all.find((tag) => sameTag(tag, typed))
  const canMake = typed !== '' && existing === undefined && isTagName(typed)

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()

    if (existing !== undefined) {
      if (!tags.some((tag) => sameTag(tag, existing))) onAdd(existing)
    } else if (canMake) {
      onAdd(typed)
    } else {
      return
    }
    setQuery('')
  }

  return (
    <>
      <input
        type="text"
        value={query}
        onChange={(event) => { setQuery(event.target.value) }}
        onKeyDown={handleKeyDown}
        // Opening the panel is asking to type a tag, so the caret is put there.
        autoFocus={autoFocus}
        placeholder="Find or add a tag"
        aria-label="Tag name"
        autoComplete="off"
        enterKeyHint="done"
        className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />

      {shown.length > 0 && (
        <div role="group" aria-label="Tags" className="flex max-h-60 flex-col overflow-y-auto pt-0.5">
          {shown.map((tag) => {
            const chosen = tags.some((name) => sameTag(name, tag))
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={chosen}
                onClick={() => { if (chosen) onRemove(tag); else onAdd(tag) }}
                className={chosen ? `${option} ${optionOn}` : `${option} ${optionOff}`}
              >
                <span aria-hidden="true" className="w-3 shrink-0">
                  {chosen ? '✓' : ''}
                </span>
                <span className="min-w-0 truncate">{tag}</span>
              </button>
            )
          })}
        </div>
      )}

      {canMake && (
        <button
          type="button"
          onClick={() => {
            onAdd(typed)
            setQuery('')
          }}
          className={`${option} ${optionOff}`}
        >
          <span aria-hidden="true" className="w-3 shrink-0">
            +
          </span>
          <span className="min-w-0 truncate">Create “{typed}”</span>
        </button>
      )}

      {typed !== '' && !isTagName(typed) && (
        <p className={hint}>A tag is one word, without \ / " # : * ? &lt; &gt; | or commas.</p>
      )}

      {typed === '' && shown.length === 0 && <p className={hint}>Type a name to make the first tag.</p>}
    </>
  )
}
