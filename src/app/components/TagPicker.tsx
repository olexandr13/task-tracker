import { useEffect, useRef, useState } from 'react'
import { controlOff, controlOn, rowControlIcon, rowControlLabel } from '../rowControls'
import { TagIcon } from './TagIcon'
import { TagPanel } from './TagPanel'

interface TagPickerProps {
  /** The tags the task carries. */
  tags: readonly string[]
  /** Every tag there is, to choose from. */
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
 * A task's tags: a small button that opens the tag panel (TagPanel) under it.
 *
 * The same shape as the other pickers, and like them there is nothing to
 * confirm. The panel stays open throughout, since a task often takes more than one.
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
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  const summary = tags.length === 0 ? 'No tags' : tags.join(', ')

  // Only as wide as it needs to be: a square around the icon when the value is
  // not spelled out beside it.
  const button = `${showNames ? rowControlLabel : rowControlIcon} w-full`

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
          <TagPanel tags={tags} known={known} onAdd={onAdd} onRemove={onRemove} autoFocus />
        </div>
      )}
    </div>
  )
}
