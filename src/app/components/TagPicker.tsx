import { useRef, useState } from 'react'
import { controlOff, controlOn, rowControlIcon } from '../rowControls'
import { PickerPanel } from './PickerPanel'
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
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * A task's tags: a small button that opens the tag panel (TagPanel) under it.
 * On a wide screen it sits on the woken row (and the task's menu still opens
 * the same panel); on a phone it is on the sheet.
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
  align = 'right',
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const summary = tags.length === 0 ? 'No tags' : tags.join(', ')

  const button = `${rowControlIcon} w-full`

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
          <TagPanel tags={tags} known={known} onAdd={onAdd} onRemove={onRemove} autoFocus />
        </PickerPanel>
      )}
    </div>
  )
}
