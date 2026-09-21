import { useState, type KeyboardEvent } from 'react'
import { subtaskCheckbox, subtaskRow, subtaskTitleBox } from './SubtaskItem'

interface SubtaskDraftProps {
  taskTitle: string
  /** Enter with something typed: the item is made, and the line stays open under it. */
  onAdd: (title: string) => void
  onClose: () => void
  /** Backspace in the empty line: it goes, and the list says where the caret goes. */
  onBackspaceWhenEmpty: () => void
}

/**
 * The blank line Enter opens under an item, looking like the item it will be.
 *
 * It is not an item yet: a checklist has no nameless items, so nothing is saved
 * until there is a title. Enter adds it and opens the next line, so a list can be
 * written straight down from the middle as well as from the foot. Clicking away
 * keeps what was typed, as a rename does; an empty line, Enter or Escape closes it.
 */
export function SubtaskDraft({ taskTitle, onAdd, onClose, onBackspaceWhenEmpty }: SubtaskDraftProps) {
  const [title, setTitle] = useState('')

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const trimmed = title.trim()
      if (trimmed.length === 0) {
        onClose()
        return
      }
      onAdd(trimmed)
      setTitle('')
      return
    }

    if (event.key === 'Escape') {
      // Closing the line unmounts the box, so the blur that follows cannot save it.
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key === 'Backspace' && title.length === 0) {
      // Otherwise the key goes on to delete a character from wherever the caret lands.
      event.preventDefault()
      onBackspaceWhenEmpty()
    }
  }

  function handleBlur() {
    const trimmed = title.trim()
    if (trimmed.length > 0) {
      onAdd(trimmed)
    }
    onClose()
  }

  return (
    <li className={subtaskRow}>
      <span aria-hidden="true" className={`${subtaskCheckbox} border-neutral-300 dark:border-neutral-600`} />

      <input
        type="text"
        value={title}
        onChange={(event) => { setTitle(event.target.value) }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        // Only ever opened by a key press, so taking the caret is what was asked for.
        autoFocus
        aria-label={`New subtask on "${taskTitle}"`}
        autoComplete="off"
        enterKeyHint="next"
        className={`${subtaskTitleBox} bg-transparent text-neutral-900 focus:outline-none dark:text-neutral-100`}
      />
    </li>
  )
}
