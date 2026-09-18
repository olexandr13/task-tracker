import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { distinctTags, isTagName, matchTags, sameTag } from '../../core'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'
import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { TagIcon } from './TagIcon'

const hint = 'px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500'

interface TagPickerProps {
  /** The tags the task carries. */
  tags: readonly string[]
  /** Every tag in use, to choose from. */
  known: readonly string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** Whether the button names the tags beside its icon, or a way to add one when there are none. */
  showNames?: boolean
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * A task's tags: a small button that opens a panel listing every tag, the task's
 * own ticked, with a box on top to find one or make a new one.
 *
 * The same shape as the date and repeat pickers beside it, and like them there
 * is nothing to confirm: a tag goes on or comes off as it is clicked, and Enter
 * in the box puts on the tag it names, making it first if there is none. The
 * panel stays open throughout, since a task often takes more than one.
 */
export function TagPicker({
  tags,
  known,
  onAdd,
  onRemove,
  label = 'Tags',
  showNames = false,
  align = 'right',
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  function close() {
    setIsOpen(false)
    setQuery('')
  }

  // A tag is typed with its `#` as often as without.
  const typed = query.trim().replace(/^#+/u, '')
  const all = distinctTags([...known, ...tags])
  const shown = matchTags(all, typed)
  const existing = all.find((tag) => sameTag(tag, typed))
  const canMake = typed !== '' && existing === undefined && isTagName(typed)
  const summary = tags.length === 0 ? 'No tags' : tags.join(', ')

  // Only as wide as it needs to be: a square around the icon when the value is
  // not spelled out beside it.
  const button = `${showNames ? rowControlLabel : rowControlIcon} w-full`

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
    <div
      ref={root}
      className="relative min-w-0 shrink"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        type="button"
        onClick={() => { if (isOpen) close(); else setIsOpen(true) }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}: ${summary}`}
        title={tags.length === 0 ? 'Add a tag' : summary}
        className={tags.length === 0 ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <TagIcon />
        {showNames && <span className="min-w-0 truncate">{tags.length === 0 ? 'Add a tag' : summary}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-1.5 flex w-56 flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900`}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => { setQuery(event.target.value) }}
            onKeyDown={handleKeyDown}
            // Opening the panel is asking to type a tag, so the caret is put there.
            autoFocus
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
        </div>
      )}
    </div>
  )
}
