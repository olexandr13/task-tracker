import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { isSubtaskComplete, type Subtask, type SubtaskId, type Repeat } from '../../core'
import { deleteControl } from '../rowControls'

interface SubtaskItemProps {
  subtask: Subtask
  /** The rule of the task this belongs to: a tick is only read against its occurrence. */
  repeat: Repeat | null
  now: Date
  /** The task this belongs to, so each control says which checklist it is on. */
  taskTitle: string
  /** Whether the title is open as a text box. The list decides, so it can hand the caret on. */
  isEditing: boolean
  onEditStart: (subtaskId: SubtaskId) => void
  onEditEnd: (subtaskId: SubtaskId) => void
  onSetDone: (subtaskId: SubtaskId, done: boolean) => void
  onRename: (subtaskId: SubtaskId, title: string) => void
  onRemove: (subtaskId: SubtaskId) => void
  /** Enter: the edit is kept, and the list opens a blank line under the item. */
  onEnter: (subtaskId: SubtaskId) => void
  /** Backspace in a box already emptied: the item goes, and the list says where the caret goes. */
  onBackspaceWhenEmpty: (subtaskId: SubtaskId) => void
}

/** Smaller than the task's own box, so the two never read as the same rank. */
export const subtaskCheckbox =
  'grid size-7 shrink-0 place-items-center rounded-md border-2 text-sm leading-none transition-colors md:size-5 md:text-xs md:rounded'

export const subtaskRow = 'flex items-center gap-2.5 py-2 md:py-1'

export const subtaskTitleBox = 'min-w-0 flex-1 text-left text-base md:text-sm'

/**
 * One item on a checklist: tick it, rename it in place, take it off the list.
 *
 * The in-place edit repeats what ./TaskItem does with a title and what
 * ./TaskDescription does with its text. Three copies is two too many, and
 * pulling them together is a step of its own — see the backlog in CLAUDE.md.
 */
export function SubtaskItem({
  subtask,
  repeat,
  now,
  taskTitle,
  isEditing,
  onEditStart,
  onEditEnd,
  onSetDone,
  onRename,
  onRemove,
  onEnter,
  onBackspaceWhenEmpty,
}: SubtaskItemProps) {
  const done = isSubtaskComplete(subtask, repeat, now)
  // Null until something is typed. The text lives here rather than in the record
  // while it is being typed, so an abandoned edit leaves nothing behind.
  const [draft, setDraft] = useState<string | null>(null)
  const editedTitle = draft ?? subtask.title
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    element.setSelectionRange(element.value.length, element.value.length)
  }, [isEditing])

  function endEdit() {
    setDraft(null)
    onEditEnd(subtask.id)
  }

  /** Keeping the edit. An empty box is an abandoned edit, not a nameless item. */
  function commitEdit() {
    const trimmed = editedTitle.trim()
    if (trimmed.length > 0) {
      onRename(subtask.id, trimmed)
    }
    endEdit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
      onEnter(subtask.id)
      return
    }

    if (event.key === 'Escape') {
      // Dropping the edit unmounts the box, so the blur that follows cannot save it.
      event.stopPropagation()
      endEdit()
      return
    }

    if (event.key === 'Backspace' && editedTitle.length === 0) {
      // Otherwise the key goes on to delete a character from wherever the caret lands.
      event.preventDefault()
      onBackspaceWhenEmpty(subtask.id)
    }
  }

  return (
    <li className={subtaskRow}>
      <button
        type="button"
        onClick={() => { onSetDone(subtask.id, !done) }}
        aria-pressed={done}
        aria-label={
          done
            ? `Mark "${subtask.title}" on "${taskTitle}" as not done`
            : `Mark "${subtask.title}" on "${taskTitle}" as done`
        }
        className={
          done
            ? `${subtaskCheckbox} border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700`
            : `${subtaskCheckbox} border-neutral-300 text-transparent hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-300`
        }
      >
        ✓
      </button>

      {!isEditing ? (
        <button
          type="button"
          onClick={() => { onEditStart(subtask.id) }}
          aria-label={`Edit "${subtask.title}" on "${taskTitle}"`}
          className={
            done
              ? `${subtaskTitleBox} cursor-text break-words text-neutral-400 line-through dark:text-neutral-600`
              : `${subtaskTitleBox} cursor-text break-words text-neutral-700 dark:text-neutral-200`
          }
        >
          {subtask.title}
        </button>
      ) : (
        <input
          ref={input}
          type="text"
          value={editedTitle}
          onChange={(event) => { setDraft(event.target.value) }}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          aria-label={`Title of "${subtask.title}" on "${taskTitle}"`}
          autoComplete="off"
          enterKeyHint="next"
          className={`${subtaskTitleBox} bg-transparent text-neutral-900 focus:outline-none dark:text-neutral-100`}
        />
      )}

      <button
        type="button"
        onClick={() => { onRemove(subtask.id) }}
        aria-label={`Delete "${subtask.title}" from "${taskTitle}"`}
        className={`shrink-0 rounded px-1.5 leading-none ${deleteControl}`}
      >
        ×
      </button>
    </li>
  )
}
