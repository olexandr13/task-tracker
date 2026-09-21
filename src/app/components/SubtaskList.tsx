import { useRef, useState, type KeyboardEvent } from 'react'
import type { Subtask, SubtaskId, Repeat } from '../../core'
import { SubtaskDraft } from './SubtaskDraft'
import { SubtaskItem, subtaskRow } from './SubtaskItem'

interface SubtaskListProps {
  subtasks: readonly Subtask[]
  /** The rule of the task these belong to: a tick is only read against its occurrence. */
  repeat: Repeat | null
  now: Date
  taskTitle: string
  /** Adds at `index`: the foot of the list from the add box, under an item from a line Enter opened. */
  onAdd: (index: number, title: string) => void
  onSetDone: (subtaskId: SubtaskId, done: boolean) => void
  onRename: (subtaskId: SubtaskId, title: string) => void
  onRemove: (subtaskId: SubtaskId) => void
}

/**
 * The checklist, and the line that adds to it.
 *
 * The box keeps its focus after each Enter, so a list can be typed straight
 * down rather than clicked back into item by item. It does not take the caret
 * on the way in: the checklist comes up with the row now, on any click into the
 * task, and a list that grabbed the keyboard every time would be reaching for
 * something it had not been asked for.
 *
 * Which item is open for editing, and where a blank line is open, are held here
 * rather than by each item, so the caret can be handed along the list: Enter in
 * an item opens a line under it, and Backspace in an emptied one takes it away
 * and opens its neighbour.
 */
export function SubtaskList({
  subtasks,
  repeat,
  now,
  taskTitle,
  onAdd,
  onSetDone,
  onRename,
  onRemove,
}: SubtaskListProps) {
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<SubtaskId | null>(null)
  // Where the blank line sits: the index the item typed into it will take.
  const [draftIndex, setDraftIndex] = useState<number | null>(null)
  const addInput = useRef<HTMLInputElement>(null)
  const isEmpty = subtasks.length === 0

  // Only ever closing the item that asked: a blur arriving after the caret has
  // already been handed to a neighbour must not close the neighbour.
  function handleEditEnd(subtaskId: SubtaskId) {
    setEditingId((current) => (current === subtaskId ? null : current))
  }

  /**
   * The caret goes back to the item above. The first item has none, so it goes
   * to the one that takes its place, and to the add box once nothing is left.
   */
  function handleBackspaceWhenEmpty(subtaskId: SubtaskId) {
    const index = subtasks.findIndex((subtask) => subtask.id === subtaskId)
    const neighbour = index > 0 ? subtasks[index - 1] : subtasks[index + 1]

    onRemove(subtaskId)
    openForEditing(neighbour?.id ?? null)
  }

  function handleEnter(subtaskId: SubtaskId) {
    const index = subtasks.findIndex((subtask) => subtask.id === subtaskId)
    setDraftIndex(index + 1)
  }

  function handleDraftAdd(title: string) {
    if (draftIndex === null) return
    onAdd(draftIndex, title)
    setDraftIndex(draftIndex + 1)
  }

  /** An empty blank line taken back with Backspace hands the caret to the item above it. */
  function handleDraftBackspace() {
    const above = draftIndex === null ? undefined : subtasks[draftIndex - 1]
    setDraftIndex(null)
    openForEditing(above?.id ?? null)
  }

  /** With nothing to open, the caret goes to the add box rather than being dropped. */
  function openForEditing(subtaskId: SubtaskId | null) {
    setEditingId(subtaskId)
    if (subtaskId === null) addInput.current?.focus()
  }

  // As in ../components/AddTaskForm, Enter is the only way to submit: there is
  // no button, and handling the key directly keeps that the single path.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const trimmed = title.trim()
      if (trimmed.length === 0) return
      onAdd(subtasks.length, trimmed)
      setTitle('')
      return
    }

    if (event.key === 'Escape' && title.length > 0) {
      // Clearing what is half-typed before the row's own Escape handling can
      // reach anything behind it.
      event.stopPropagation()
      setTitle('')
    }
  }

  const rows = subtasks.map((subtask) => (
    <SubtaskItem
      key={subtask.id}
      subtask={subtask}
      repeat={repeat}
      now={now}
      taskTitle={taskTitle}
      isEditing={subtask.id === editingId}
      onEditStart={setEditingId}
      onEditEnd={handleEditEnd}
      onSetDone={onSetDone}
      onRename={onRename}
      onRemove={onRemove}
      onEnter={handleEnter}
      onBackspaceWhenEmpty={handleBackspaceWhenEmpty}
    />
  ))
  // A sibling under one key rather than a child of the item above, so adding an
  // item in front of it does not remount it and take the caret away.
  if (draftIndex !== null) {
    rows.splice(
      draftIndex,
      0,
      <SubtaskDraft
        key="draft"
        taskTitle={taskTitle}
        onAdd={handleDraftAdd}
        onClose={() => { setDraftIndex(null) }}
        onBackspaceWhenEmpty={handleDraftBackspace}
      />,
    )
  }

  return (
    <div>
      {!isEmpty && (
        <ul aria-label={`Checklist for "${taskTitle}"`} className="flex flex-col">
          {rows}
        </ul>
      )}

      <div className={subtaskRow}>
        <span aria-hidden="true" className="w-7 shrink-0 text-center text-base leading-none text-neutral-400 md:w-5 md:text-sm dark:text-neutral-500">
          +
        </span>

        <input
          ref={addInput}
          type="text"
          value={title}
          onChange={(event) => { setTitle(event.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="Add subtask"
          aria-label={`Add a subtask to "${taskTitle}"`}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none md:text-sm dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>
    </div>
  )
}
